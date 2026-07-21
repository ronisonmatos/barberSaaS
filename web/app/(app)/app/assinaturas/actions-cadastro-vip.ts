"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { normalizePhoneBR } from "@/lib/phone";
import { criarCobrancaPixGateway } from "@/lib/gateway-pagamento";
import {
  parseHorarioFixoFormData,
  validarHorarioFixo,
  upsertHorarioFixo,
  type Regra,
  type HorarioFixoInput,
} from "@/lib/horario-fixo";

const schema = z.object({
  planoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Informe o nome do cliente." }),
  telefone: z.string().min(1, { error: "Informe o telefone do cliente." }),
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function cadastrarClienteVipPix(formData: FormData): Promise<{
  error?: string;
  assinaturaId?: string;
  pagamentoId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}> {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();

  const parsed = schema.safeParse({
    planoId: formData.get("planoId"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "Telefone inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();

  // Já configurando horário fixo junto? Valida TUDO antes de criar a assinatura/cobrança de
  // verdade -- evita gerar um Pix real pra uma configuração que nem passaria na validação.
  const incluirHorarioFixo = formData.get("incluirHorarioFixo") === "on";
  let horarioFixoDados: HorarioFixoInput | undefined;
  if (incluirHorarioFixo) {
    const parsedHorario = parseHorarioFixoFormData(formData);
    if (!parsedHorario.success) {
      return { error: parsedHorario.error.issues[0]?.message ?? "Dados do horário fixo inválidos." };
    }
    horarioFixoDados = parsedHorario.data;

    const { data: plano } = await supabase
      .from("planos_estabelecimento")
      .select("regras")
      .eq("id", parsed.data.planoId)
      .eq("estabelecimento_id", estabelecimento.id)
      .maybeSingle();
    const regrasDoPlano = (plano?.regras as Regra[] | null) ?? [];

    const validacao = await validarHorarioFixo(supabase, {
      estabelecimentoId: estabelecimento.id,
      papel,
      userId,
      assinaturaClienteId: null,
      horarioFixoIdAtual: null,
      regrasDoPlano,
      dados: horarioFixoDados,
    });
    if (validacao.error) return validacao;
  }

  const { data: criado, error: rpcError } = await supabase
    .rpc("criar_assinatura_publica_pix", {
      p_estabelecimento_id: estabelecimento.id,
      p_plano_id: parsed.data.planoId,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
    })
    .single();
  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar assinatura." };

  if (horarioFixoDados) {
    await upsertHorarioFixo(supabase, {
      estabelecimentoId: estabelecimento.id,
      assinaturaClienteId: criado.assinatura_id,
      horarioFixoId: null,
      dados: horarioFixoDados,
    });
  }

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: pagamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("gateway_ativo, mercado_pago_access_token, asaas_api_key")
      .eq("estabelecimento_id", estabelecimento.id)
      .single(),
    serviceRole.from("pagamentos").select("valor_centavos").eq("id", criado.pagamento_id).single(),
  ]);
  if (!config || !pagamento) return { error: "Configuração de pagamento indisponível." };

  try {
    const cobranca = await criarCobrancaPixGateway(config, {
      idempotencyKey: criado.pagamento_id,
      valorCentavos: pagamento.valor_centavos,
      descricao: "Assinatura do clube",
      nomePagador: parsed.data.nome,
      emailPagador: parsed.data.email,
    });

    await serviceRole
      .from("pagamentos")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", criado.pagamento_id);

    revalidatePath("/app/assinaturas");
    return {
      assinaturaId: criado.assinatura_id,
      pagamentoId: criado.pagamento_id,
      qrCode: cobranca.qrCode,
      qrCodeBase64: cobranca.qrCodeBase64,
    };
  } catch (err) {
    await serviceRole.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", criado.assinatura_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao gerar cobrança Pix." };
  }
}

export async function statusAssinaturaVip(pagamentoId: string): Promise<{
  pagamentoStatus: string;
  assinaturaStatus: string | null;
}> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("status, assinatura_cliente_id")
    .eq("id", pagamentoId)
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();
  if (!pagamento) return { pagamentoStatus: "desconhecido", assinaturaStatus: null };

  let assinaturaStatus: string | null = null;
  if (pagamento.assinatura_cliente_id) {
    const { data: assinatura } = await supabase
      .from("assinaturas_clientes")
      .select("status")
      .eq("id", pagamento.assinatura_cliente_id)
      .maybeSingle();
    assinaturaStatus = assinatura?.status ?? null;
  }

  return { pagamentoStatus: pagamento.status, assinaturaStatus };
}
