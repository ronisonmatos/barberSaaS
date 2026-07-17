"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { normalizePhoneBR } from "@/lib/phone";
import { estornarPagamento } from "@/lib/mercadopago";

export async function buscarSlotsDisponiveis(
  profissionalId: string,
  servicoId: string,
  data: string
) {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const { data: slots, error } = await supabase.rpc("slots_disponiveis", {
    p_estabelecimento_id: estabelecimento.id,
    p_profissional_id: profissionalId,
    p_servico_id: servicoId,
    p_data: data,
  });
  if (error) return [];
  return slots ?? [];
}

const manualSchema = z.object({
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid(),
  inicio: z.string().min(1),
  clienteId: z.string().uuid().optional(),
  clienteNome: z.string().trim().optional(),
  clienteTelefone: z.string().trim().optional(),
});

export async function criarAgendamentoManual(
  input: z.infer<typeof manualSchema>
): Promise<{ error?: string }> {
  const parsed = manualSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  let clienteId = parsed.data.clienteId;
  if (!clienteId) {
    const telefone = parsed.data.clienteTelefone
      ? normalizePhoneBR(parsed.data.clienteTelefone)
      : null;
    if (!parsed.data.clienteNome || !telefone) {
      return { error: "Informe um cliente existente ou nome + telefone válidos." };
    }
    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .upsert(
        { estabelecimento_id: estabelecimento.id, nome: parsed.data.clienteNome, telefone },
        { onConflict: "estabelecimento_id,telefone" }
      )
      .select("id")
      .single();
    if (clienteError) return { error: clienteError.message };
    clienteId = cliente.id;
  }

  const { data: servico, error: servicoError } = await supabase
    .from("servicos")
    .select("duracao_minutos, preco_centavos")
    .eq("id", parsed.data.servicoId)
    .single();
  if (servicoError || !servico) return { error: "Serviço não encontrado." };

  const inicio = new Date(parsed.data.inicio);
  const fim = new Date(inicio.getTime() + servico.duracao_minutos * 60_000);

  const { error } = await supabase.from("agendamentos").insert({
    estabelecimento_id: estabelecimento.id,
    cliente_id: clienteId,
    profissional_id: parsed.data.profissionalId,
    servico_id: parsed.data.servicoId,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    status: "confirmado",
    origem: "painel",
    preco_centavos: servico.preco_centavos,
  });

  if (error) {
    if (error.message.includes("agendamentos_sem_conflito")) {
      return { error: "Esse horário acabou de ficar indisponível para este profissional." };
    }
    return { error: error.message };
  }

  revalidatePath("/app/agenda");
  return {};
}

export async function atualizarStatusAgendamento(
  id: string,
  status: "confirmado" | "concluido" | "cancelado" | "no_show"
) {
  const supabase = await createClient();
  await supabase.from("agendamentos").update({ status }).eq("id", id);
  revalidatePath("/app/agenda");
}

export async function marcarChegada(id: string) {
  const supabase = await createClient();
  await supabase.from("agendamentos").update({ chegou_em: new Date().toISOString() }).eq("id", id);
  revalidatePath("/app/agenda");
}

export async function reembolsarAgendamento(agendamentoId: string): Promise<{ error?: string }> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") {
    return { error: "Só o dono do estabelecimento pode solicitar reembolsos." };
  }

  const supabase = await createClient();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("id, status")
    .eq("id", agendamentoId)
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!agendamento) return { error: "Agendamento não encontrado." };
  if (agendamento.status !== "cancelado" && agendamento.status !== "no_show") {
    return { error: "Só é possível reembolsar agendamentos cancelados ou marcados como não compareceu." };
  }

  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("id, status, gateway_payment_id, metodo")
    .eq("agendamento_id", agendamento.id)
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();
  if (!pagamento || pagamento.status !== "pago" || !pagamento.gateway_payment_id) {
    return { error: "Não há pagamento confirmado para reembolsar nesse agendamento." };
  }
  if (pagamento.metodo !== "pix" && pagamento.metodo !== "cartao") {
    return { error: "Esse pagamento não passou pelo gateway e não pode ser reembolsado por aqui." };
  }

  const { data: config } = await supabase
    .from("estabelecimento_pagamento_config")
    .select("mercado_pago_access_token")
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!config?.mercado_pago_access_token) {
    return { error: "Configuração do Mercado Pago ausente para este estabelecimento." };
  }

  try {
    await estornarPagamento(pagamento.gateway_payment_id, config.mercado_pago_access_token);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao solicitar reembolso no Mercado Pago." };
  }

  revalidatePath("/app/agenda");
  return {};
}
