import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubeWizard, type PlanoClube } from "./clube-wizard";
import { PAGINA_WRAP, PAGINA_CARTAO } from "../estilos";

type Regra = { servico_id: string; quantidade_mes: number };

export default async function ClubePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ asaas_pagamento_id?: string; token?: string }>;
}) {
  const { slug } = await params;
  const { asaas_pagamento_id: asaasPagamentoId, token } = await searchParams;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!estabelecimento) notFound();

  const [{ data: planos }, { data: servicos }, { data: formasPagamento }] = await Promise.all([
    supabase
      .from("planos_estabelecimento")
      .select("id, nome, descricao, preco_centavos, regras")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("preco_centavos"),
    supabase.from("servicos").select("id, nome").eq("estabelecimento_id", estabelecimento.id),
    supabase.rpc("formas_pagamento_publico", { p_estabelecimento_id: estabelecimento.id }).maybeSingle(),
  ]);

  const nomeServico = (id: string) => servicos?.find((s) => s.id === id)?.nome ?? "serviço removido";

  const planosClube: PlanoClube[] = (planos ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    precoCentavos: p.preco_centavos,
    regras: ((p.regras as Regra[] | null) ?? []).map((r) => ({
      servicoNome: nomeServico(r.servico_id),
      quantidadeMes: r.quantidade_mes,
    })),
  }));

  return (
    <div className={PAGINA_WRAP}>
      <div className={`${PAGINA_CARTAO} p-6`}>
        <ClubeWizard
          estabelecimento={estabelecimento}
          planos={planosClube}
          initialAguardandoCartao={asaasPagamentoId && token ? { pagamentoId: asaasPagamentoId, token } : null}
          formasPagamento={
            formasPagamento ?? {
              aceita_pagamento_antecipado: false,
              aceita_pagamento_no_dia: true,
              gateway_ativo: "nenhum",
              mercado_pago_public_key: null,
            }
          }
        />
      </div>
    </div>
  );
}
