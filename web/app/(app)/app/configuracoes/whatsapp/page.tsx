import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { WhatsappForm } from "./whatsapp-form";
import { VoltarConfiguracoes } from "../voltar-link";

function mascarar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.length <= 4) return "••••";
  return `••••${valor.slice(-4)}`;
}

export default async function WhatsappConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>WhatsApp</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("estabelecimento_whatsapp_config")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>WhatsApp</Heading>
      <Card className="bg-marfim p-4 text-sm text-cinza-600">
        Configure sua própria conta do WhatsApp Business Platform (Meta) pra enviar avisos de
        renovação do clube de assinatura também por WhatsApp, além do e-mail. É{" "}
        <strong>opcional</strong>: sem isso, os avisos continuam saindo só por e-mail.
      </Card>
      <Card className="p-4">
        <WhatsappForm
          ativo={config?.ativo ?? false}
          phoneNumberId={config?.phone_number_id ?? null}
          accessTokenMascarado={mascarar(config?.access_token)}
          nomeTemplateLembrete={config?.nome_template_lembrete ?? "lembrete_renovacao"}
          idiomaTemplate={config?.idioma_template ?? "pt_BR"}
        />
      </Card>
    </div>
  );
}
