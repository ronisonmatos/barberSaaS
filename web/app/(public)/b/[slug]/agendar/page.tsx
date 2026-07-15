import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendarWizard } from "./agendar-wizard";

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: barbearia } = await supabase
    .from("barbearias")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!barbearia) notFound();

  const [{ data: servicos }, { data: profissionais }, { data: vinculos }] = await Promise.all([
    supabase
      .from("servicos")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("profissionais")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("profissional_servicos")
      .select("profissional_id, servico_id, profissionais!inner(barbearia_id)")
      .eq("profissionais.barbearia_id", barbearia.id),
  ]);

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <AgendarWizard
        barbearia={barbearia}
        servicos={servicos ?? []}
        profissionais={profissionais ?? []}
        vinculos={vinculos ?? []}
      />
    </div>
  );
}
