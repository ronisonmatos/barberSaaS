import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { consultarPagamentoAsaas, tokensIguais } from "@/lib/asaas";
import { aplicarResultadoPagamento } from "@/lib/pagamento-webhook";

export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null);
  const dataId = corpo?.payment?.id ? String(corpo.payment.id) : null;
  if (!corpo || !dataId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();
  const colunas = "id, estabelecimento_id, agendamento_id, pedido_id, assinatura_cliente_id";

  let { data: pagamento } = await supabase.from("pagamentos").select(colunas).eq("gateway_payment_id", dataId).maybeSingle();

  // Pagamentos criados via Checkout (cartao Asaas) nao tem gateway_payment_id no momento de gerar
  // o link -- so agora, quando o pagador confirma, e que sabemos o id real. Nesse caso o lookup
  // usa o externalReference que setamos na criacao do checkout (id da propria linha de pagamentos).
  if (!pagamento && corpo?.payment?.externalReference) {
    ({ data: pagamento } = await supabase
      .from("pagamentos")
      .select(colunas)
      .eq("id", String(corpo.payment.externalReference))
      .maybeSingle());
  }

  if (!pagamento) {
    // Notificacao de um pagamento que nao criamos por aqui -- ignora.
    return NextResponse.json({ ok: true });
  }

  const { data: config } = await supabase
    .from("estabelecimento_pagamento_config")
    .select("asaas_api_key, asaas_webhook_token")
    .eq("estabelecimento_id", pagamento.estabelecimento_id)
    .single();

  if (!config?.asaas_api_key || !config.asaas_webhook_token) {
    return NextResponse.json({ error: "configuração ausente" }, { status: 400 });
  }

  if (!tokensIguais(request.headers.get("asaas-access-token"), config.asaas_webhook_token)) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  const evento = corpo.event ?? "payment";
  const { error: eventoError } = await supabase.from("webhook_eventos").insert({
    origem: "asaas",
    evento_id_externo: `${dataId}:${evento}`,
    payload: corpo,
  });
  if (eventoError) {
    // unique_violation = evento ja processado antes, ignora silenciosamente (idempotencia)
    return NextResponse.json({ ok: true });
  }

  const pagamentoAsaas = await consultarPagamentoAsaas(dataId, config.asaas_api_key);

  // Idempotente pro Pix direto (ja tinha); preenche pela primeira vez pro cartao via Checkout.
  await supabase.from("pagamentos").update({ gateway_payment_id: dataId }).eq("id", pagamento.id);

  if (["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(pagamentoAsaas.status)) {
    await aplicarResultadoPagamento(supabase, pagamento, "pago");
  } else if (["OVERDUE", "DELETED"].includes(pagamentoAsaas.status)) {
    await aplicarResultadoPagamento(supabase, pagamento, "falhou");
  } else if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(pagamentoAsaas.status)) {
    await aplicarResultadoPagamento(supabase, pagamento, "estornado");
  }

  await supabase.from("webhook_eventos").update({ processado_em: new Date().toISOString() }).eq("evento_id_externo", `${dataId}:${evento}`);

  return NextResponse.json({ ok: true });
}
