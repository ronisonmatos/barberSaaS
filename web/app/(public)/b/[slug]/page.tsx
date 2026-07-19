import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeClassico } from "./home-classico";
import { HomePrestigio } from "./home-prestigio";

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

  const [{ data: servicos }, { data: profissionais }, { data: fotos }, { data: produtos }] = await Promise.all([
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
  ]);

  const props = {
    slug,
    estabelecimento,
    servicos: servicos ?? [],
    profissionais: profissionais ?? [],
    fotos: fotos ?? [],
    produtos: produtos ?? [],
  };

  const config = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const layout = typeof config.layout === "string" ? config.layout : "classico";

  if (layout === "prestigio") {
    return <HomePrestigio {...props} />;
  }
  return <HomeClassico {...props} />;
}
