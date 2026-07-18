"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizePhoneBR } from "@/lib/phone";
import { criarCobrancaPix, criarCobrancaCartao } from "@/lib/mercadopago";
import { validarCPF, apenasNumeros } from "@/lib/cpf";
import { devolverEstoquePedido } from "@/lib/estoque";

const itemSchema = z.object({ produtoId: z.string().uuid(), quantidade: z.number().int().positive() });

const schema = z.object({
  estabelecimentoId: z.string().uuid(),
  itens: z.array(itemSchema).min(1, { error: "Adicione ao menos um produto ao carrinho." }),
  nome: z.string().trim().min(2, { error: "Informe seu nome." }),
  telefone: z.string().min(1, { error: "Informe seu WhatsApp." }),
});

function itensParaJsonb(itens: { produtoId: string; quantidade: number }[]) {
  return itens.map((i) => ({ produto_id: i.produtoId, quantidade: i.quantidade }));
}

export async function criarPedidoPublico(
  input: z.infer<typeof schema>
): Promise<{ error?: string; pedidoId?: string; token?: string }> {
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
    .rpc("criar_pedido_publico", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_itens: itensParaJsonb(parsed.data.itens),
      p_nome: parsed.data.nome,
      p_telefone: telefone,
    })
    .single();

  if (error) return { error: error.message };

  return { pedidoId: data.pedido_id, token: data.token_acesso };
}

const schemaPix = schema.extend({ email: z.email({ error: "Informe um e-mail válido." }) });

export async function criarPedidoPix(input: z.infer<typeof schemaPix>): Promise<{
  error?: string;
  pedidoId?: string;
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
    .rpc("criar_pedido_publico_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_itens: itensParaJsonb(parsed.data.itens),
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar pedido." };

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
    const cobranca = await criarCobrancaPix({
      accessToken: config.mercado_pago_access_token,
      idempotencyKey: criado.pedido_id,
      valorCentavos: pagamento.valor_centavos,
      descricao: "Pedido de produtos",
      emailPagador: parsed.data.email,
    });

    await serviceRole
      .from("pagamentos")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", criado.pagamento_id);

    return {
      pedidoId: criado.pedido_id,
      pagamentoId: criado.pagamento_id,
      token: criado.token_acesso,
      qrCode: cobranca.qrCode,
      qrCodeBase64: cobranca.qrCodeBase64,
    };
  } catch (err) {
    await devolverEstoquePedido(serviceRole, criado.pedido_id);
    await serviceRole.from("pedidos").update({ status: "cancelado" }).eq("id", criado.pedido_id);
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

export async function criarPedidoCartao(
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
    .rpc("criar_pedido_publico_pix", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_itens: itensParaJsonb(parsed.data.itens),
      p_nome: parsed.data.nome,
      p_telefone: telefone,
      p_email: parsed.data.email,
      p_metodo: "cartao",
    })
    .single();

  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar pedido." };

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
      descricao: "Pedido de produtos",
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
      await serviceRole.from("pedidos").update({ status: "aguardando_retirada" }).eq("id", criado.pedido_id);
      return { confirmado: true, token: criado.token_acesso, pagamentoId: criado.pagamento_id };
    }

    if (cobranca.status === "rejected") {
      await devolverEstoquePedido(serviceRole, criado.pedido_id);
      await serviceRole.from("pedidos").update({ status: "cancelado" }).eq("id", criado.pedido_id);
      await serviceRole.from("pagamentos").update({ status: "falhou" }).eq("id", criado.pagamento_id);
      return { error: "Cartão recusado. Tente outro cartão ou outra forma de pagamento." };
    }

    // in_process/pending: fica pendente, o webhook confirma quando resolver.
    return { confirmado: false, token: criado.token_acesso, pagamentoId: criado.pagamento_id };
  } catch (err) {
    await devolverEstoquePedido(serviceRole, criado.pedido_id);
    await serviceRole.from("pedidos").update({ status: "cancelado" }).eq("id", criado.pedido_id);
    await serviceRole.from("pagamentos").update({ status: "cancelado" }).eq("id", criado.pagamento_id);
    return { error: err instanceof Error ? err.message : "Erro ao processar cartão." };
  }
}
