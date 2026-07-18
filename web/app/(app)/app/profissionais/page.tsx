import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { ProfissionaisClient } from "./profissionais-client";
import { Heading } from "@/components/ui/heading";

export default async function ProfissionaisPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [{ data: profissionais }, { data: servicos }, { data: jornadas }, { data: vinculos }, { data: membros }] =
    await Promise.all([
      supabase.from("profissionais").select("*").eq("estabelecimento_id", estabelecimento.id).order("nome"),
      supabase.from("servicos").select("*").eq("estabelecimento_id", estabelecimento.id).order("nome"),
      supabase.from("jornadas").select("*").eq("estabelecimento_id", estabelecimento.id),
      supabase
        .from("profissional_servicos")
        .select("profissional_id, servico_id, profissionais!inner(estabelecimento_id)")
        .eq("profissionais.estabelecimento_id", estabelecimento.id),
      papel === "owner"
        ? supabase
            .from("membros_estabelecimento")
            .select("usuario_id, usuarios(nome)")
            .eq("estabelecimento_id", estabelecimento.id)
            .eq("ativo", true)
        : Promise.resolve({ data: null }),
    ]);

  const contas = (membros ?? []).map((m) => ({ usuarioId: m.usuario_id, nome: m.usuarios?.nome ?? "—" }));

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
      <Heading>Profissionais</Heading>
      <ProfissionaisClient
        profissionais={profissionais ?? []}
        servicos={servicos ?? []}
        jornadasPorProfissional={jornadasPorProfissional}
        servicoIdsPorProfissional={servicoIdsPorProfissional}
        contas={contas}
        podeVincularConta={papel === "owner"}
      />
    </div>
  );
}
