"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { normalizePhoneBR } from "@/lib/phone";

export async function buscarSlotsDisponiveis(
  profissionalId: string,
  servicoId: string,
  data: string
) {
  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();
  const { data: slots, error } = await supabase.rpc("slots_disponiveis", {
    p_barbearia_id: barbearia.id,
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

  const { barbearia } = await getBarbeariaAtiva();
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
        { barbearia_id: barbearia.id, nome: parsed.data.clienteNome, telefone },
        { onConflict: "barbearia_id,telefone" }
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
    barbearia_id: barbearia.id,
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
