import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { hojeNaTimezone, dataLocal, limitesDoDiaUTC, inicioDaSemana, somarDias } from "@/lib/timezone";
import { AgendaClient } from "./agenda-client";
import type { AgendamentoDetalhado } from "./agendamento-card";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "Não compareceu",
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; visao?: string }>;
}) {
  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();
  const params = await searchParams;
  const data = params.data ?? hojeNaTimezone(barbearia.timezone);
  const visao = params.visao === "semana" ? "semana" : "dia";

  const [{ data: profissionais }, { data: servicos }, { data: clientes }] = await Promise.all([
    supabase
      .from("profissionais")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("servicos")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .eq("ativo", true)
      .order("nome"),
    supabase.from("clientes").select("*").eq("barbearia_id", barbearia.id).order("nome"),
  ]);

  const rangeInicio =
    visao === "dia" ? limitesDoDiaUTC(data, barbearia.timezone).inicio : limitesDoDiaUTC(inicioDaSemana(data), barbearia.timezone).inicio;
  const rangeFim =
    visao === "dia"
      ? limitesDoDiaUTC(data, barbearia.timezone).fim
      : limitesDoDiaUTC(somarDias(inicioDaSemana(data), 7), barbearia.timezone).inicio;

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, inicio, fim, status, profissional_id, clientes(nome), servicos(nome)")
    .eq("barbearia_id", barbearia.id)
    .gte("inicio", rangeInicio.toISOString())
    .lt("inicio", rangeFim.toISOString())
    .order("inicio");

  const detalhados: (AgendamentoDetalhado & { profissional_id: string })[] = (agendamentos ?? []).map(
    (ag) => ({
      id: ag.id,
      inicio: ag.inicio,
      fim: ag.fim,
      status: ag.status,
      profissional_id: ag.profissional_id,
      cliente_nome: ag.clientes?.nome ?? "—",
      servico_nome: ag.servicos?.nome ?? "—",
    })
  );

  const diaAnterior = somarDias(data, visao === "dia" ? -1 : -7);
  const diaSeguinte = somarDias(data, visao === "dia" ? 1 : 7);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Agenda</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/app/agenda?data=${diaAnterior}&visao=${visao}`}
            className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700"
          >
            ← anterior
          </Link>
          <span className="font-medium">{data}</span>
          <Link
            href={`/app/agenda?data=${diaSeguinte}&visao=${visao}`}
            className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700"
          >
            próxima →
          </Link>
          <Link
            href={`/app/agenda?data=${data}&visao=dia`}
            className={`ml-4 underline ${visao === "dia" ? "font-semibold" : "text-neutral-500"}`}
          >
            Dia
          </Link>
          <Link
            href={`/app/agenda?data=${data}&visao=semana`}
            className={`underline ${visao === "semana" ? "font-semibold" : "text-neutral-500"}`}
          >
            Semana
          </Link>
        </div>
      </div>

      {visao === "dia" ? (
        <AgendaClient
          data={data}
          profissionais={profissionais ?? []}
          servicos={servicos ?? []}
          clientes={clientes ?? []}
          agendamentosPorProfissional={Object.groupBy(detalhados, (a) => a.profissional_id)}
        />
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => somarDias(inicioDaSemana(data), i)).map((dia) => (
            <div key={dia} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
              <Link href={`/app/agenda?data=${dia}&visao=dia`} className="text-sm font-medium underline">
                {DIAS_SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()]} {dia.slice(8)}
              </Link>
              {detalhados
                .filter((ag) => dataLocal(ag.inicio, barbearia.timezone) === dia)
                .map((ag) => (
                  <div key={ag.id} className="rounded bg-neutral-100 p-1 text-xs dark:bg-neutral-800">
                    <p>{new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p>{ag.cliente_nome}</p>
                    <p className="text-neutral-500">{STATUS_LABEL[ag.status]}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
