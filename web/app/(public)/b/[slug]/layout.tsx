import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EstabelecimentoHeader } from "./estabelecimento-header";

const TEMA_PADRAO = "classica";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("estabelecimentos")
    .select("nome, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return {};

  return {
    title: data.nome,
    icons: data.logo_url ? { icon: data.logo_url } : undefined,
  };
}

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
  const cores = config.cores as
    | { bg: string; bg2: string; fg: string; linha: string; acento: string; acentoFg: string }
    | undefined;

  // Cores customizadas (config.cores) sobrescrevem o preset [data-tema] via CSS custom
  // properties inline -- data-tema continua definindo o preset de base/fallback quando o
  // estabelecimento nunca personalizou (compatível com estabelecimentos existentes).
  const estiloCores = cores
    ? ({
        "--tenant-bg": cores.bg,
        "--tenant-bg-2": cores.bg2,
        "--tenant-fg": cores.fg,
        "--tenant-linha": cores.linha,
        "--tenant-acento": cores.acento,
        "--tenant-acento-fg": cores.acentoFg,
      } as React.CSSProperties)
    : undefined;

  const ano = new Date().getFullYear();

  return (
    <div data-tema={tema} style={estiloCores} className="flex min-h-screen flex-col">
      {data && <EstabelecimentoHeader slug={slug} nome={data.nome} logoUrl={data.logo_url} />}
      <div className="flex-1">{children}</div>
      <footer className="border-t border-tenant-linha px-4 py-3 text-center text-xs text-tenant-fg/60">
        Powered by Comptus · © {ano} · Todos os direitos reservados.
      </footer>
    </div>
  );
}
