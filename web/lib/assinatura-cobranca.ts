import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { criarCobrancaPixGateway } from "@/lib/gateway-pagamento";

/**
 * Cria (ou renova, via o on conflict(cliente_id, plano_id) que a RPC já faz) uma assinatura e
 * gera a cobrança Pix do ciclo. Reaproveitado tanto no cadastro de cliente VIP quanto na
 * renovação manual pelo painel -- as duas situações terminam no mesmo lugar: uma assinatura
 * 'pendente' + um Pix pra alguém pagar.
 */
export async function gerarCobrancaPixAssinatura(
  supabase: SupabaseClient<Database>,
  params: {
    estabelecimentoId: string;
    planoId: string;
    nome: string;
    telefone: string;
    email: string;
  }
): Promise<{
  error?: string;
  assinaturaId?: string;
  pagamentoId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}> {
  const { data: criado, error: rpcError } = await supabase
    .rpc("criar_assinatura_publica_pix", {
      p_estabelecimento_id: params.estabelecimentoId,
      p_plano_id: params.planoId,
      p_nome: params.nome,
      p_telefone: params.telefone,
      p_email: params.email,
    })
    .single();
  if (rpcError || !criado) return { error: rpcError?.message ?? "Erro ao criar assinatura." };

  const serviceRole = createServiceRoleClient();
  const [{ data: config }, { data: pagamento }] = await Promise.all([
    serviceRole
      .from("estabelecimento_pagamento_config")
      .select("gateway_ativo, mercado_pago_access_token, asaas_api_key")
      .eq("estabelecimento_id", params.estabelecimentoId)
      .single(),
    serviceRole.from("pagamentos").select("valor_centavos").eq("id", criado.pagamento_id).single(),
  ]);
  if (!config || !pagamento) return { error: "Configuração de pagamento indisponível." };

  try {
    const cobranca = await criarCobrancaPixGateway(config, {
      idempotencyKey: criado.pagamento_id,
      valorCentavos: pagamento.valor_centavos,
      descricao: "Assinatura do clube",
      nomePagador: params.nome,
      emailPagador: params.email,
    });

    await serviceRole
      .from("pagamentos")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", criado.pagamento_id);

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
