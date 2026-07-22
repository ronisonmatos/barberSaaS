"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizePhoneBR } from "@/lib/phone";
import { criarCobrancaCartao } from "@/lib/mercadopago";
import { criarCobrancaPixGateway } from "@/lib/gateway-pagamento";
import { criarCheckoutAsaas } from "@/lib/asaas";
import { validarCPF, apenasNumeros } from "@/lib/cpf";

const MAX_PARCELAS_ASAAS = 12;

const schema = z.object({
  estabelecimentoId: z.string().uuid(),
  planoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Informe seu nome." }),
  telefone: z.string().min(1, { error: "Informe seu WhatsApp." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  cpf: z.string().optional(),
});

export async function assinarPlanoPix(input: z.infer<typeof schema>): Promise<{
  error?: string;
  assinaturaId?: string;
  pagamentoId?: string;
  token?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();
  const { data: criado, error: rpcError } = await supabase
    .rpc("criar_assinatura_publica_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_plano_id: parsed.data.planoId,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar assinatura." };

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: pagamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("gateway_ativo, mercado_pago_access_token, asaas_api_key")
      .eq("estabelecimento_id", parsed.data.estabelecimentoId)
      .single(),
    serviceRole.from("pagamentos").select("valor_centavos").eq("id", criado.pagamento_id).single(),
  ]);

  if (!config || !pagamento) {
    return { error: "Configuração de pagamento indisponível." };
  }

  try {
    const cobranca = await criarCobrancaPixGateway(config, {
      idempotencyKey: criado.pagamento_id,
      valorCentavos: pagamento.valor_centavos,
      descricao: "Assinatura do clube",
      nomePagador: parsed.data.nome,
      emailPagador: parsed.data.email,
      cpfPagador: parsed.data.cpf,
    });

    await serviceRole
      .from("pagamentos")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", criado.pagamento_id);

    return {
      assinaturaId: criado.assinatura_id,
      pagamentoId: criado.pagamento_id,
      token: criado.token_acesso,
      qrCode: cobranca.qrCode,
      qrCodeBase64: cobranca.qrCodeBase64,
    };
  } catch (err) {
    await serviceRole.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", criado.assinatura_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao gerar cobrança Pix." };
  }
}

const schemaCartao = schema.extend({
  cpf: z.string().refine(validarCPF, { error: "CPF inválido." }),
  formData: z.object({
    token: z.string().min(1),
    payment_method_id: z.string().min(1),
    issuer_id: z.string().optional(),
    installments: z.number().int().positive(),
  }),
});

export async function assinarPlanoCartao(
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
    .rpc("criar_assinatura_publica_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_plano_id: parsed.data.planoId,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
      p_metodo: "cartao",
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar assinatura." };

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: pagamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("mercado_pago_access_token")
      .eq("estabelecimento_id", parsed.data.estabelecimentoId)
      .single(),
    serviceRole.from("pagamentos").select("valor_centavos").eq("id", criado.pagamento_id).single(),
  ]);

  if (!config?.mercado_pago_access_token || !pagamento) {
    return { error: "Configuração de pagamento indisponível." };
  }

  try {
    const cobranca = await criarCobrancaCartao({
      accessToken: config.mercado_pago_access_token,
      idempotencyKey: criado.pagamento_id,
      valorCentavos: pagamento.valor_centavos,
      descricao: "Assinatura do clube",
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
      const cicloFim = new Date();
      cicloFim.setDate(cicloFim.getDate() + 30);
      await serviceRole
        .from("pagamentos")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", criado.pagamento_id);
      await serviceRole
        .from("assinaturas_clientes")
        .update({
          status: "ativa",
          ciclo_inicio: new Date().toISOString(),
          ciclo_fim: cicloFim.toISOString(),
          usos_ciclo: {},
          lembrete_renovacao_enviado_em: null,
        })
        .eq("id", criado.assinatura_id);
      return { confirmado: true, token: criado.token_acesso, pagamentoId: criado.pagamento_id };
    }

    if (cobranca.status === "rejected") {
      await serviceRole.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", criado.assinatura_id);
      await serviceRole.from("pagamentos").update({ status: "falhou" }).eq("id", criado.pagamento_id);
      return { error: "Cartão recusado. Tente outro cartão ou outra forma de pagamento." };
    }

    // in_process/pending: fica pendente, o webhook confirma quando resolver.
    return { confirmado: false, token: criado.token_acesso, pagamentoId: criado.pagamento_id };
  } catch (err) {
    await serviceRole.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", criado.assinatura_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao processar cartão." };
  }
}

const schemaCartaoAsaas = schema.extend({ slug: z.string().min(1) });

export async function assinarPlanoCartaoAsaas(input: z.infer<typeof schemaCartaoAsaas>): Promise<{
  error?: string;
  token?: string;
  checkoutUrl?: string;
}> {
  const parsed = schemaCartaoAsaas.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();
  const { data: criado, error: rpcError } = await supabase
    .rpc("criar_assinatura_publica_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_plano_id: parsed.data.planoId,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
      p_metodo: "cartao",
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar assinatura." };

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: pagamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("asaas_api_key")
      .eq("estabelecimento_id", parsed.data.estabelecimentoId)
      .single(),
    serviceRole.from("pagamentos").select("valor_centavos").eq("id", criado.pagamento_id).single(),
  ]);

  if (!config?.asaas_api_key || !pagamento) {
    return { error: "Configuração de pagamento indisponível." };
  }

  try {
    const checkout = await criarCheckoutAsaas({
      apiKey: config.asaas_api_key,
      valorCentavos: pagamento.valor_centavos,
      descricao: "Assinatura do clube",
      externalReference: criado.pagamento_id,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/b/${parsed.data.slug}/clube?asaas_pagamento_id=${criado.pagamento_id}&token=${criado.token_acesso}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/b/${parsed.data.slug}/clube`,
      maxInstallmentCount: MAX_PARCELAS_ASAAS,
      billingTypes: ["CREDIT_CARD"],
    });
    return { token: criado.token_acesso, checkoutUrl: checkout.link };
  } catch (err) {
    await serviceRole.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", criado.assinatura_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao criar checkout na Asaas." };
  }
}
