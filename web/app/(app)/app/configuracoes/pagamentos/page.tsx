import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { PagamentoForm } from "../pagamento-form";
import { VoltarConfiguracoes } from "../voltar-link";

function mascarar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.length <= 4) return "••••";
  return `••••${valor.slice(-4)}`;
}

type Gateway = "nenhum" | "mercado_pago" | "asaas";

function gatewayValido(valor: string | undefined): Gateway {
  return valor === "mercado_pago" || valor === "asaas" ? valor : "nenhum";
}

export default async function PagamentosConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Pagamentos</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: pagamentoConfig }, { data: plano }] = await Promise.all([
    supabase
      .from("estabelecimento_pagamento_config")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .maybeSingle(),
    estabelecimento.plano_plataforma_id
      ? supabase
          .from("planos_plataforma")
          .select("recursos")
          .eq("id", estabelecimento.plano_plataforma_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const permitePagamentoOnline = !estabelecimento.plano_plataforma_id
    ? true
    : ((plano?.recursos as Record<string, boolean> | null)?.pagamento_online ?? false);

  if (!permitePagamentoOnline) {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Pagamentos</Heading>
        <Card className="p-4 text-sm text-cinza-600">
          Pagamento online não está disponível no plano Free.{" "}
          <Link href="/app/configuracoes/plano" className="font-medium text-latao-escuro underline">
            Faça upgrade de plano
          </Link>{" "}
          para habilitar cobrança pelo agendamento.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Pagamentos</Heading>
      <Card className="p-4">
        <PagamentoForm
          gatewayAtivo={gatewayValido(pagamentoConfig?.gateway_ativo)}
          aceitaPagamentoAntecipado={pagamentoConfig?.aceita_pagamento_antecipado ?? false}
          aceitaPagamentoNoDia={pagamentoConfig?.aceita_pagamento_no_dia ?? true}
          mercadoPagoTokenMascarado={mascarar(pagamentoConfig?.mercado_pago_access_token)}
          mercadoPagoPublicKey={pagamentoConfig?.mercado_pago_public_key ?? null}
          mercadoPagoWebhookSecretMascarado={mascarar(pagamentoConfig?.mercado_pago_webhook_secret)}
          asaasChaveMascarada={mascarar(pagamentoConfig?.asaas_api_key)}
          urlWebhook={`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`}
        />
      </Card>
    </div>
  );
}
