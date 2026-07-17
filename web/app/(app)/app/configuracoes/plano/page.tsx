import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VoltarConfiguracoes } from "../voltar-link";
import { PlanoCard } from "./plano-card";

export default async function PlanoConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [{ data: planos }, { data: assinatura }, { data: userData }] = await Promise.all([
    supabase.from("planos_plataforma").select("*").eq("ativo", true).order("preco_centavos"),
    supabase
      .from("assinaturas_plataforma")
      .select("plano_plataforma_id, status, proximo_vencimento")
      .eq("estabelecimento_id", estabelecimento.id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const publicKey = process.env.MERCADO_PAGO_PLATFORM_PUBLIC_KEY ?? null;
  const pagamentoConfigurado = Boolean(process.env.MERCADO_PAGO_PLATFORM_ACCESS_TOKEN);
  const trialAte = estabelecimento.trial_ate
    ? new Date(`${estabelecimento.trial_ate}T00:00:00`).toLocaleDateString("pt-BR")
    : null;
  const vencimento = assinatura?.proximo_vencimento
    ? new Date(`${assinatura.proximo_vencimento}T00:00:00`).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Plano</Heading>

      {estabelecimento.status === "trial" ? (
        <Card className="p-4 text-sm text-cinza-600">
          Você está no período trial{trialAte ? ` até ${trialAte}` : ""}. Escolha um plano abaixo para
          continuar depois disso.
        </Card>
      ) : vencimento ? (
        <Card className="p-4">
          <p className="text-sm text-cinza-600">Próximo vencimento</p>
          <p className="font-display text-2xl text-carvao">{vencimento}</p>
        </Card>
      ) : null}

      {!pagamentoConfigurado && papel === "owner" && (
        <Card className="border-latao p-4 text-sm text-cinza-600">
          Pagamento de assinatura ainda não configurado pela plataforma. As opções abaixo ficam
          disponíveis assim que isso for ativado.
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {(planos ?? []).map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            ativo={estabelecimento.plano_plataforma_id === plano.id && estabelecimento.status === "ativa"}
            podeAssinar={papel === "owner"}
            publicKey={publicKey}
            email={userData.user?.email ?? ""}
          />
        ))}
      </div>
    </div>
  );
}
