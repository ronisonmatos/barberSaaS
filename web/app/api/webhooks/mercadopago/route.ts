import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { consultarPagamentoMercadoPago, verificarAssinaturaWebhookMercadoPago } from "@/lib/mercadopago";
import { aplicarResultadoPagamento } from "@/lib/pagamento-webhook";

export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null);
  if (!corpo || corpo.type !== "payment" || !corpo.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const dataId =
    request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id") ?? String(corpo.data.id);

  const supabase = createServiceRoleClient();

  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("id, estabelecimento_id, agendamento_id, pedido_id, assinatura_cliente_id")
    .eq("gateway_payment_id", dataId)
    .maybeSingle();

  if (!pagamento) {
    // Notificacao de um pagamento que nao criamos por aqui (ex: teste do painel do Mercado Pago) -- ignora.
    return NextResponse.json({ ok: true });
  }

  const { data: config } = await supabase
    .from("estabelecimento_pagamento_config")
    .select("mercado_pago_access_token, mercado_pago_webhook_secret")
    .eq("estabelecimento_id", pagamento.estabelecimento_id)
    .single();

  if (!config?.mercado_pago_access_token || !config.mercado_pago_webhook_secret) {
    return NextResponse.json({ error: "configuração ausente" }, { status: 400 });
  }

  const assinaturaValida = verificarAssinaturaWebhookMercadoPago({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
    secret: config.mercado_pago_webhook_secret,
  });
  if (!assinaturaValida) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const { error: eventoError } = await supabase.from("webhook_eventos").insert({
    origem: "mercadopago",
    evento_id_externo: `${dataId}:${corpo.action ?? "payment"}`,
    payload: corpo,
  });
  if (eventoError) {
    // unique_violation = evento ja processado antes, ignora silenciosamente (idempotencia)
    return NextResponse.json({ ok: true });
  }

  const pagamentoMercadoPago = await consultarPagamentoMercadoPago(dataId, config.mercado_pago_access_token);

  if (pagamentoMercadoPago.status === "approved") {
    await aplicarResultadoPagamento(supabase, pagamento, "pago");
  } else if (["rejected", "cancelled"].includes(pagamentoMercadoPago.status)) {
    await aplicarResultadoPagamento(supabase, pagamento, "falhou");
  } else if (pagamentoMercadoPago.status === "refunded") {
    await aplicarResultadoPagamento(supabase, pagamento, "estornado");
  }

  await supabase
    .from("webhook_eventos")
    .update({ processado_em: new Date().toISOString() })
    .eq("evento_id_externo", `${dataId}:${corpo.action ?? "payment"}`);

  return NextResponse.json({ ok: true });
}
