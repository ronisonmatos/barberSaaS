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

  const { data } = await supabase.from("estabelecimentos").select("config").eq("slug", slug).maybeSingle();

  const config = (data?.config ?? {}) as Record<string, unknown>;
  const tema = typeof config.tema === "string" ? config.tema : TEMA_PADRAO;

  return (
    <div data-tema={tema} className="min-h-screen">
      {children}
    </div>
  );
}
