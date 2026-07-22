import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeClassico } from "./home-classico";
import { HomePrestigio } from "./home-prestigio";
import { HomeAtelier, type RitualPasso } from "./home-atelier";
import { DemonstracaoBanner } from "./demonstracao-banner";

export default async function EstabelecimentoPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
    { data: fotos },
    { data: produtos },
    { data: planos },
    { data: nomesServicos },
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
      .from("estabelecimento_fotos")
      .select("id, url")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("produtos")
      .select("id, nome, preco_centavos, foto_url, slug")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("ordem")
      .limit(4),
    supabase
      .from("planos_estabelecimento")
      .select("id, nome, preco_centavos, regras")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("preco_centavos")
      .limit(3),
    supabase.from("servicos").select("id, nome").eq("estabelecimento_id", estabelecimento.id),
  ]);

  const nomeServico = (id: string) => nomesServicos?.find((s) => s.id === id)?.nome ?? "serviço removido";
  const planosComRegras = (planos ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    preco_centavos: p.preco_centavos,
    regras: ((p.regras as { servico_id: string; quantidade_mes: number }[] | null) ?? []).map((r) => ({
      servicoNome: nomeServico(r.servico_id),
      quantidadeMes: r.quantidade_mes,
    })),
  }));

  const props = {
    slug,
    estabelecimento,
    servicos: servicos ?? [],
    profissionais: profissionais ?? [],
    fotos: fotos ?? [],
    produtos: produtos ?? [],
    planos: planosComRegras,
  };

  const config = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const layout = typeof config.layout === "string" ? config.layout : "classico";
  const ritual = Array.isArray(config.ritual) ? (config.ritual as RitualPasso[]) : [];

  return (
    <>
      {estabelecimento.rascunho && (
        <DemonstracaoBanner
          estabelecimentoId={estabelecimento.id}
          nome={estabelecimento.nome}
          expiraEm={estabelecimento.rascunho_expira_em}
        />
      )}
      {layout === "prestigio" ? (
        <HomePrestigio {...props} />
      ) : layout === "atelier" ? (
        <HomeAtelier {...props} ritual={ritual} />
      ) : (
        <HomeClassico {...props} />
      )}
    </>
  );
}
