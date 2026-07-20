import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { ProfissionaisRascunhoClient } from "./profissionais-rascunho-client";

export default async function EditarProfissionaisRascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSuperAdminERascunho(id);

  const supabase = await createClient();
  const [{ data: profissionais }, { data: servicos }, { data: jornadas }, { data: vinculos }] = await Promise.all([
    supabase.from("profissionais").select("*").eq("estabelecimento_id", id).order("nome"),
    supabase.from("servicos").select("*").eq("estabelecimento_id", id).order("nome"),
    supabase.from("jornadas").select("*").eq("estabelecimento_id", id),
    supabase
      .from("profissional_servicos")
      .select("profissional_id, servico_id, profissionais!inner(estabelecimento_id)")
      .eq("profissionais.estabelecimento_id", id),
  ]);

  const jornadasPorProfissional: Record<string, { dia_semana: number; hora_inicio: string; hora_fim: string }[]> = {};
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
    <ProfissionaisRascunhoClient
      estabelecimentoId={id}
      profissionais={profissionais ?? []}
      servicos={servicos ?? []}
      jornadasPorProfissional={jornadasPorProfissional}
      servicoIdsPorProfissional={servicoIdsPorProfissional}
    />
  );
}
