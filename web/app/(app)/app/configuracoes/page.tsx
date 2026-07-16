import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { PerfilForm } from "./perfil-form";
import { PagamentoForm } from "./pagamento-form";

function mascarar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.length <= 4) return "••••";
  return `••••${valor.slice(-4)}`;
}

type Gateway = "nenhum" | "mercado_pago" | "asaas";

function gatewayValido(valor: string | undefined): Gateway {
  return valor === "mercado_pago" || valor === "asaas" ? valor : "nenhum";
}

export default async function ConfiguracoesPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: pagamentoConfig } =
    papel === "owner"
      ? await supabase
          .from("estabelecimento_pagamento_config")
          .select("*")
          .eq("estabelecimento_id", estabelecimento.id)
          .maybeSingle()
      : { data: null };

  return (
    <div className="flex flex-col gap-6">
      <Heading>Configurações</Heading>

      <Card className="p-4">
        <Heading as="h2" className="mb-4">
          Perfil
        </Heading>
        <PerfilForm nomeAtual={estabelecimento.nome} logoUrl={estabelecimento.logo_url} />
      </Card>

      {papel === "owner" && (
        <Card className="p-4">
          <Heading as="h2" className="mb-4">
            Pagamentos
          </Heading>
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
      )}

      <Card className="flex items-center justify-between p-4">
        <div>
          <Heading as="h2">Suporte</Heading>
          <p className="text-sm text-cinza-600">Precisa de ajuda? Veja ou abra um chamado.</p>
        </div>
        <Link href="/app/suporte">
          <Button variant="secondary">Ver meus chamados</Button>
        </Link>
      </Card>
    </div>
  );
}
