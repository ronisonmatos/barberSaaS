import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VoltarConfiguracoes } from "../voltar-link";
import { PlanoCard } from "./plano-card";
import { AguardandoConfirmacaoAsaas } from "./aguardando-confirmacao-asaas";

export default async function PlanoConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ asaas_pagamento_id?: string }>;
}) {
  const { asaas_pagamento_id: asaasPagamentoId } = await searchParams;
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [
    { data: planos },
    { data: assinatura },
    { data: userData },
    { data: publicKey },
    { data: pagamentoConfigurado },
    { data: gatewayAtivo },
  ] = await Promise.all([
    supabase.from("planos_plataforma").select("*").eq("ativo", true).order("preco_centavos"),
    supabase
      .from("assinaturas_plataforma")
      .select("plano_plataforma_id, status, proximo_vencimento, preco_promocional_centavos, preco_promocional_ate")
      .eq("estabelecimento_id", estabelecimento.id)
      .maybeSingle(),
    supabase.auth.getUser(),
    supabase.rpc("mercado_pago_platform_public_key"),
    supabase.rpc("pagamento_plataforma_configurado"),
    supabase.rpc("gateway_plataforma_ativo"),
  ]);
  const gateway = gatewayAtivo === "asaas" ? "asaas" : "mercado_pago";
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

      {asaasPagamentoId && <AguardandoConfirmacaoAsaas pagamentoId={asaasPagamentoId} />}

      <div className="grid gap-3 md:grid-cols-3">
        {(planos ?? []).map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            ativo={estabelecimento.plano_plataforma_id === plano.id && estabelecimento.status === "ativa"}
            assinaturaAtual={assinatura ?? null}
            podeAssinar={papel === "owner"}
            publicKey={publicKey}
            email={userData.user?.email ?? ""}
            gatewayAtivo={gateway}
          />
        ))}
      </div>
    </div>
  );
}
