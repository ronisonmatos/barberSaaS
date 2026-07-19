import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendarWizard } from "./agendar-wizard";
import { PAGINA_WRAP, PAGINA_CARTAO } from "../estilos";

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!estabelecimento) notFound();

  const [
    { data: servicos },
    { data: profissionais },
    { data: vinculos },
    { data: formasPagamento },
    { data: produtos },
    { data: programasFidelidade },
  ] = await Promise.all([
    supabase
      .from("servicos")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("profissionais")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("profissional_servicos")
      .select("profissional_id, servico_id, profissionais!inner(estabelecimento_id)")
      .eq("profissionais.estabelecimento_id", estabelecimento.id),
    supabase.rpc("formas_pagamento_publico", { p_estabelecimento_id: estabelecimento.id }).maybeSingle(),
    supabase
      .from("produtos")
      .select("id, nome, preco_centavos, foto_url, estoque")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("programas_fidelidade")
      .select("servico_id, selos_necessarios, brinde_tipo, brinde_servico_id, brinde_produto_id")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true),
  ]);

  // Resolve o nome do brinde localmente (servicos/produtos ja foram buscados acima) em vez de
  // fazer join no banco -- e so pra montar o texto do aviso no wizard, sem info sensivel.
  const programasFidelidadePorServico = (programasFidelidade ?? []).map((p) => ({
    servicoId: p.servico_id,
    selosNecessarios: p.selos_necessarios,
    brinde:
      p.brinde_tipo === "servico"
        ? (servicos?.find((s) => s.id === p.brinde_servico_id)?.nome ?? "brinde")
        : (produtos?.find((pr) => pr.id === p.brinde_produto_id)?.nome ?? "brinde"),
  }));

  return (
    <div className={PAGINA_WRAP}>
      <div className={`${PAGINA_CARTAO} p-6`}>
        <AgendarWizard
          estabelecimento={estabelecimento}
          servicos={servicos ?? []}
          profissionais={profissionais ?? []}
          vinculos={vinculos ?? []}
          formasPagamento={
            formasPagamento ?? {
              aceita_pagamento_antecipado: false,
              aceita_pagamento_no_dia: true,
              gateway_ativo: "nenhum",
              mercado_pago_public_key: null,
            }
          }
          produtos={produtos ?? []}
          programasFidelidade={programasFidelidadePorServico}
        />
      </div>
    </div>
  );
}
