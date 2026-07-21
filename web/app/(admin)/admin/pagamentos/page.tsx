import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { PagamentoPlataformaForm } from "./pagamento-plataforma-form";

function mascarar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.length <= 4) return "••••";
  return `••••${valor.slice(-4)}`;
}

export default async function AdminPagamentosPage() {
  await getSuperAdmin();

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("configuracao_plataforma")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .maybeSingle();

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Heading>Pagamentos da plataforma</Heading>
      <p className="text-sm text-cinza-600">
        Credenciais usadas pra cobrar a assinatura do Comptus dos estabelecimentos e a compra de
        templates premium — diferente da configuração de pagamento de cada estabelecimento (essa
        fica em cada painel deles, pra cobrar os próprios clientes).
      </p>
      <Card className="p-4">
        <PagamentoPlataformaForm
          gatewayAtivo={config?.gateway_ativo === "asaas" ? "asaas" : "mercado_pago"}
          mercadoPagoPublicKey={config?.mercado_pago_public_key ?? ""}
          mercadoPagoTokenMascarado={mascarar(config?.mercado_pago_access_token)}
          mercadoPagoWebhookSecretMascarado={mascarar(config?.mercado_pago_webhook_secret)}
          asaasChaveMascarada={mascarar(config?.asaas_api_key)}
          asaasWebhookTokenMascarado={mascarar(config?.asaas_webhook_token)}
          urlWebhook={`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago-plataforma`}
          urlWebhookAsaas={`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/asaas-plataforma`}
        />
      </Card>
    </div>
  );
}
