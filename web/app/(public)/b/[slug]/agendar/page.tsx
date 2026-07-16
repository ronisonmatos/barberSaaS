import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendarWizard } from "./agendar-wizard";

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!estabelecimento) notFound();

  const [{ data: servicos }, { data: profissionais }, { data: vinculos }] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <AgendarWizard
        estabelecimento={estabelecimento}
        servicos={servicos ?? []}
        profissionais={profissionais ?? []}
        vinculos={vinculos ?? []}
      />
    </div>
  );
}
