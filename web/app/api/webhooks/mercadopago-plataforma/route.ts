import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { consultarPagamentoMercadoPago, verificarAssinaturaWebhookMercadoPago } from "@/lib/mercadopago";
import { confirmarPagamentoPlataforma } from "@/lib/assinatura-plataforma";
import { confirmarCompraTema } from "@/lib/tema-plataforma";
import { getConfiguracaoPlataforma } from "@/lib/configuracao-plataforma";

export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null);
  if (!corpo || corpo.type !== "payment" || !corpo.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const dataId =
    request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id") ?? String(corpo.data.id);

  const configuracao = await getConfiguracaoPlataforma();
  const accessToken = configuracao?.mercado_pago_access_token;
  const webhookSecret = configuracao?.mercado_pago_webhook_secret;
  if (!accessToken || !webhookSecret) {
    return NextResponse.json({ error: "configuração da plataforma ausente" }, { status: 500 });
  }

  const assinaturaValida = verificarAssinaturaWebhookMercadoPago({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
    secret: webhookSecret,
  });
  if (!assinaturaValida) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: pagamento } = await supabase
    .from("pagamentos_plataforma")
    .select("id, estabelecimento_id, plano_plataforma_id, tema_plataforma_id")
    .eq("gateway_payment_id", dataId)
    .maybeSingle();

  if (!pagamento) {
    // Notificação de um pagamento que não criamos por aqui -- ignora.
    return NextResponse.json({ ok: true });
  }

  const { error: eventoError } = await supabase.from("webhook_eventos").insert({
    origem: "mercadopago_plataforma",
    evento_id_externo: `${dataId}:${corpo.action ?? "payment"}`,
    payload: corpo,
  });
  if (eventoError) {
    // unique_violation = evento ja processado antes, ignora silenciosamente (idempotencia)
    return NextResponse.json({ ok: true });
  }

  const pagamentoMercadoPago = await consultarPagamentoMercadoPago(dataId, accessToken);

  if (pagamentoMercadoPago.status === "approved") {
    if (pagamento.plano_plataforma_id) {
      await confirmarPagamentoPlataforma(supabase, {
        id: pagamento.id,
        estabelecimento_id: pagamento.estabelecimento_id,
        plano_plataforma_id: pagamento.plano_plataforma_id,
      });
    } else if (pagamento.tema_plataforma_id) {
      await confirmarCompraTema(supabase, {
        id: pagamento.id,
        estabelecimento_id: pagamento.estabelecimento_id,
        tema_plataforma_id: pagamento.tema_plataforma_id,
      });
    }
  } else if (["rejected", "cancelled"].includes(pagamentoMercadoPago.status)) {
    await supabase.from("pagamentos_plataforma").update({ status: "falhou" }).eq("id", pagamento.id);
  }

  await supabase
    .from("webhook_eventos")
    .update({ processado_em: new Date().toISOString() })
    .eq("evento_id_externo", `${dataId}:${corpo.action ?? "payment"}`);

  return NextResponse.json({ ok: true });
}
