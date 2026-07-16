"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizePhoneBR } from "@/lib/phone";
import { criarCobrancaPix, criarCobrancaCartao } from "@/lib/mercadopago";
import { validarCPF, apenasNumeros } from "@/lib/cpf";

export async function buscarSlotsPublico(
  estabelecimentoId: string,
  profissionalId: string,
  servicoId: string,
  data: string
) {
  const supabase = await createClient();
  const { data: slots, error } = await supabase.rpc("slots_disponiveis", {
    p_estabelecimento_id: estabelecimentoId,
    p_profissional_id: profissionalId,
    p_servico_id: servicoId,
    p_data: data,
  });
  if (error) return [];
  return slots ?? [];
}

const schema = z.object({
  estabelecimentoId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid(),
  inicio: z.string().min(1),
  nome: z.string().trim().min(2, { error: "Informe seu nome." }),
  telefone: z.string().min(1, { error: "Informe seu WhatsApp." }),
});

export async function criarAgendamentoPublico(
  input: z.infer<typeof schema>
): Promise<{ error?: string; agendamentoId?: string; token?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("criar_agendamento_publico", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_profissional_id: parsed.data.profissionalId,
      p_servico_id: parsed.data.servicoId,
      p_inicio: parsed.data.inicio,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
    })
    .single();

  if (error) return { error: error.message };

  return { agendamentoId: data.agendamento_id, token: data.token_acesso };
}

const schemaPix = schema.extend({
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function criarAgendamentoPix(input: z.infer<typeof schemaPix>): Promise<{
  error?: string;
  agendamentoId?: string;
  pagamentoId?: string;
  token?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}> {
  const parsed = schemaPix.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();
  const { data: criado, error: rpcError } = await supabase
    .rpc("criar_agendamento_publico_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_profissional_id: parsed.data.profissionalId,
      p_servico_id: parsed.data.servicoId,
      p_inicio: parsed.data.inicio,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar agendamento." };

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: agendamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("mercado_pago_access_token")
      .eq("estabelecimento_id", parsed.data.estabelecimentoId)
      .single(),
    serviceRole.from("agendamentos").select("preco_centavos").eq("id", criado.agendamento_id).single(),
  ]);

  if (!config?.mercado_pago_access_token || !agendamento) {
    return { error: "Configuração de pagamento indisponível." };
  }

  try {
    const cobranca = await criarCobrancaPix({
      accessToken: config.mercado_pago_access_token,
      idempotencyKey: criado.agendamento_id,
      valorCentavos: agendamento.preco_centavos,
      descricao: "Agendamento",
      emailPagador: parsed.data.email,
    });

    await serviceRole
      .from("pagamentos")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", criado.pagamento_id);

    return {
      agendamentoId: criado.agendamento_id,
      pagamentoId: criado.pagamento_id,
      token: criado.token_acesso,
      qrCode: cobranca.qrCode,
      qrCodeBase64: cobranca.qrCodeBase64,
    };
  } catch (err) {
    await serviceRole.from("agendamentos").update({ status: "cancelado" }).eq("id", criado.agendamento_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao gerar cobrança Pix." };
  }
}

const schemaCartao = schema.extend({
  email: z.email({ error: "Informe um e-mail válido." }),
  cpf: z.string().refine(validarCPF, { error: "CPF inválido." }),
  formData: z.object({
    token: z.string().min(1),
    payment_method_id: z.string().min(1),
    issuer_id: z.string().optional(),
    installments: z.number().int().positive(),
  }),
});

export async function criarAgendamentoCartao(
  input: z.infer<typeof schemaCartao>
): Promise<{ error?: string; confirmado?: boolean; token?: string; pagamentoId?: string }> {
  const parsed = schemaCartao.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }
  const cpf = apenasNumeros(parsed.data.cpf);

  const supabase = await createClient();
  const { data: criado, error: rpcError } = await supabase
    .rpc("criar_agendamento_publico_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_profissional_id: parsed.data.profissionalId,
      p_servico_id: parsed.data.servicoId,
      p_inicio: parsed.data.inicio,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
      p_metodo: "cartao",
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar agendamento." };

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: agendamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("mercado_pago_access_token")
      .eq("estabelecimento_id", parsed.data.estabelecimentoId)
      .single(),
    serviceRole.from("agendamentos").select("preco_centavos").eq("id", criado.agendamento_id).single(),
  ]);

  if (!config?.mercado_pago_access_token || !agendamento) {
    return { error: "Configuração de pagamento indisponível." };
  }

  try {
    const cobranca = await criarCobrancaCartao({
      accessToken: config.mercado_pago_access_token,
      idempotencyKey: criado.pagamento_id,
      valorCentavos: agendamento.preco_centavos,
      descricao: "Agendamento",
      formData: {
        token: parsed.data.formData.token,
        payment_method_id: parsed.data.formData.payment_method_id,
        issuer_id: parsed.data.formData.issuer_id,
        installments: parsed.data.formData.installments,
        payer: { email: parsed.data.email, identification: { type: "CPF", number: cpf } },
      },
    });

    await serviceRole
      .from("pagamentos")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", criado.pagamento_id);

    if (cobranca.status === "approved") {
      await serviceRole
        .from("pagamentos")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", criado.pagamento_id);
      await serviceRole.from("agendamentos").update({ status: "confirmado" }).eq("id", criado.agendamento_id);
      return { confirmado: true, token: criado.token_acesso, pagamentoId: criado.pagamento_id };
    }

    if (cobranca.status === "rejected") {
      await serviceRole.from("agendamentos").update({ status: "cancelado" }).eq("id", criado.agendamento_id);
      await serviceRole.from("pagamentos").update({ status: "falhou" }).eq("id", criado.pagamento_id);
      return { error: "Cartão recusado. Tente outro cartão ou outra forma de pagamento." };
    }

    // in_process/pending: fica pendente, o webhook confirma quando resolver.
    return { confirmado: false, token: criado.token_acesso, pagamentoId: criado.pagamento_id };
  } catch (err) {
    await serviceRole.from("agendamentos").update({ status: "cancelado" }).eq("id", criado.agendamento_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao processar cartão." };
  }
}

export async function consultarStatusPagamento(pagamentoId: string, token: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc("status_pagamento_publico", { p_pagamento_id: pagamentoId, p_token: token })
    .maybeSingle();
  return data ?? null;
}
