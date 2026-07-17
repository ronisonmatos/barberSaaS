import { createClient } from "@/lib/supabase/server";
import { EstabelecimentoHeader } from "./estabelecimento-header";

const TEMA_PADRAO = "classica";

export default async function EstabelecimentoPublicoLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("estabelecimentos")
    .select("nome, logo_url, config")
    .eq("slug", slug)
    .maybeSingle();

  const config = (data?.config ?? {}) as Record<string, unknown>;
  const tema = typeof config.tema === "string" ? config.tema : TEMA_PADRAO;

  const ano = new Date().getFullYear();

  return (
    <div data-tema={tema} className="flex min-h-screen flex-col">
      {data && <EstabelecimentoHeader slug={slug} nome={data.nome} logoUrl={data.logo_url} />}
      <div className="flex-1">{children}</div>
      <footer className="border-t border-tenant-linha px-4 py-3 text-center text-xs text-tenant-fg/60">
        Powered by Comptus · © {ano} · Todos os direitos reservados.
      </footer>
    </div>
  );
}
