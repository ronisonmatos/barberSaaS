import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { ProfissionaisClient } from "./profissionais-client";

export default async function ProfissionaisPage() {
  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();

  const [{ data: profissionais }, { data: servicos }, { data: jornadas }, { data: vinculos }] =
    await Promise.all([
      supabase.from("profissionais").select("*").eq("barbearia_id", barbearia.id).order("nome"),
      supabase.from("servicos").select("*").eq("barbearia_id", barbearia.id).order("nome"),
      supabase.from("jornadas").select("*").eq("barbearia_id", barbearia.id),
      supabase
        .from("profissional_servicos")
        .select("profissional_id, servico_id, profissionais!inner(barbearia_id)")
        .eq("profissionais.barbearia_id", barbearia.id),
    ]);

  const jornadasPorProfissional: Record<string, { dia_semana: number; hora_inicio: string; hora_fim: string }[]> =
    {};
  for (const j of jornadas ?? []) {
    (jornadasPorProfissional[j.profissional_id] ??= []).push({
      dia_semana: j.dia_semana,
      hora_inicio: j.hora_inicio.slice(0, 5),
      hora_fim: j.hora_fim.slice(0, 5),
    });
  }

  const servicoIdsPorProfissional: Record<string, string[]> = {};
  for (const v of vinculos ?? []) {
    (servicoIdsPorProfissional[v.profissional_id] ??= []).push(v.servico_id);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Profissionais</h1>
      <ProfissionaisClient
        profissionais={profissionais ?? []}
        servicos={servicos ?? []}
        jornadasPorProfissional={jornadasPorProfissional}
        servicoIdsPorProfissional={servicoIdsPorProfissional}
      />
    </div>
  );
}
