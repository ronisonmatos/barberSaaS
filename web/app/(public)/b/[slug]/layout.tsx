import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div data-tema={tema} className="min-h-screen">
      {data && (
        <header className="flex items-center gap-2 border-b border-tenant-linha px-4 py-3">
          <Link href={`/b/${slug}`} className="flex items-center gap-2">
            {data.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
              <img
                src={data.logo_url}
                alt={data.nome}
                className="h-8 w-8 shrink-0 rounded-md border border-tenant-linha object-cover"
              />
            ) : null}
            <span className="truncate font-display text-base text-tenant-fg">{data.nome}</span>
          </Link>
        </header>
      )}
      {children}
    </div>
  );
}
