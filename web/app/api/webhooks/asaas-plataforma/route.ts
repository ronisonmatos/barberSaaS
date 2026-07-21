import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { consultarPagamentoAsaas, tokensIguais } from "@/lib/asaas";
import { confirmarPagamentoPlataforma } from "@/lib/assinatura-plataforma";
import { confirmarCompraTema } from "@/lib/tema-plataforma";
import { getConfiguracaoPlataforma } from "@/lib/configuracao-plataforma";

function metodoPorBillingType(billingType: string): "pix" | "cartao" {
  return billingType === "CREDIT_CARD" ? "cartao" : "pix";
}

export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null);
  const dataId = corpo?.payment?.id ? String(corpo.payment.id) : null;
  // Diferente de todo resto do sistema: o Checkout so cria o pagamento de fato quando o pagador
  // confirma, entao nao temos gateway_payment_id no momento de gerar o link -- o lookup usa o
  // externalReference que setamos na criacao do checkout (id de pagamentos_plataforma).
  const pagamentoId = corpo?.payment?.externalReference ? String(corpo.payment.externalReference) : null;
  if (!corpo || !dataId || !pagamentoId) {
    return NextResponse.json({ ok: true });
  }

  const configuracao = await getConfiguracaoPlataforma();
  if (!configuracao?.asaas_api_key || !configuracao.asaas_webhook_token) {
    return NextResponse.json({ error: "configuração da plataforma ausente" }, { status: 500 });
  }

  if (!tokensIguais(request.headers.get("asaas-access-token"), configuracao.asaas_webhook_token)) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: pagamento } = await supabase
    .from("pagamentos_plataforma")
    .select("id, estabelecimento_id, plano_plataforma_id, tema_plataforma_id")
    .eq("id", pagamentoId)
    .maybeSingle();

  if (!pagamento) {
    // Notificação de um pagamento que não criamos por aqui -- ignora.
    return NextResponse.json({ ok: true });
  }

  const evento = corpo.event ?? "payment";
  const { error: eventoError } = await supabase.from("webhook_eventos").insert({
    origem: "asaas_plataforma",
    evento_id_externo: `${dataId}:${evento}`,
    payload: corpo,
  });
  if (eventoError) {
    // unique_violation = evento ja processado antes, ignora silenciosamente (idempotencia)
    return NextResponse.json({ ok: true });
  }

  const pagamentoAsaas = await consultarPagamentoAsaas(dataId, configuracao.asaas_api_key);

  await supabase
    .from("pagamentos_plataforma")
    .update({ gateway_payment_id: dataId, metodo: metodoPorBillingType(pagamentoAsaas.billingType) })
    .eq("id", pagamento.id);

  if (["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(pagamentoAsaas.status)) {
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
  } else if (["OVERDUE", "DELETED"].includes(pagamentoAsaas.status)) {
    await supabase.from("pagamentos_plataforma").update({ status: "falhou" }).eq("id", pagamento.id);
  } else if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(pagamentoAsaas.status)) {
    await supabase.from("pagamentos_plataforma").update({ status: "estornado" }).eq("id", pagamento.id);
  }

  await supabase.from("webhook_eventos").update({ processado_em: new Date().toISOString() }).eq("evento_id_externo", `${dataId}:${evento}`);

  return NextResponse.json({ ok: true });
}
