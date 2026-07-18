import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { hojeNaTimezone, dataLocal, limitesDoDiaUTC, inicioDaSemana, somarDias } from "@/lib/timezone";
import { AgendaClient } from "./agenda-client";
import type { AgendamentoDetalhado } from "./agendamento-card";
import { Heading } from "@/components/ui/heading";

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
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const params = await searchParams;
  const data = params.data ?? hojeNaTimezone(estabelecimento.timezone);
  const visao = params.visao === "semana" ? "semana" : "dia";

  const [{ data: profissionaisData }, { data: servicos }, { data: clientes }] = await Promise.all([
    supabase
      .from("profissionais")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("servicos")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
    supabase.from("clientes").select("*").eq("estabelecimento_id", estabelecimento.id).order("nome"),
  ]);

  // Staff vinculado a um profissional (profissionais.usuario_id) so ve/agenda pra si mesmo --
  // espelha a mesma regra da RLS de agendamentos (meu_profissional_id). Staff sem vinculo ainda
  // ve todo mundo (fallback).
  const meuProfissional = profissionaisData?.find((p) => p.usuario_id === userId);
  const profissionais =
    papel === "staff" && meuProfissional ? [meuProfissional] : (profissionaisData ?? []);

  const rangeInicio =
    visao === "dia" ? limitesDoDiaUTC(data, estabelecimento.timezone).inicio : limitesDoDiaUTC(inicioDaSemana(data), estabelecimento.timezone).inicio;
  const rangeFim =
    visao === "dia"
      ? limitesDoDiaUTC(data, estabelecimento.timezone).fim
      : limitesDoDiaUTC(somarDias(inicioDaSemana(data), 7), estabelecimento.timezone).inicio;

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      "id, inicio, fim, status, chegou_em, profissional_id, servico_id, cancelado_fora_do_prazo, clientes(nome), servicos(nome), pagamentos(status, metodo, valor_centavos)"
    )
    .eq("estabelecimento_id", estabelecimento.id)
    .gte("inicio", rangeInicio.toISOString())
    .lt("inicio", rangeFim.toISOString())
    .order("inicio");

  const detalhados: (AgendamentoDetalhado & { profissional_id: string })[] = (agendamentos ?? []).map((ag) => ({
    id: ag.id,
    inicio: ag.inicio,
    fim: ag.fim,
    status: ag.status,
    chegou_em: ag.chegou_em,
    profissional_id: ag.profissional_id,
    servico_id: ag.servico_id,
    cancelado_fora_do_prazo: ag.cancelado_fora_do_prazo,
    cliente_nome: ag.clientes?.nome ?? "—",
    servico_nome: ag.servicos?.nome ?? "—",
    pagamento: ag.pagamentos?.[0]
      ? {
          status: ag.pagamentos[0].status,
          metodo: ag.pagamentos[0].metodo,
          valor_centavos: ag.pagamentos[0].valor_centavos,
        }
      : null,
  }));

  const diaAnterior = somarDias(data, visao === "dia" ? -1 : -7);
  const diaSeguinte = somarDias(data, visao === "dia" ? 1 : 7);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading>Agenda</Heading>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/app/agenda?data=${diaAnterior}&visao=${visao}`}
            className="rounded-md border border-linha px-2 py-1 text-carvao hover:bg-marfim"
          >
            ← anterior
          </Link>
          <span className="font-medium text-carvao">{data}</span>
          <Link
            href={`/app/agenda?data=${diaSeguinte}&visao=${visao}`}
            className="rounded-md border border-linha px-2 py-1 text-carvao hover:bg-marfim"
          >
            próxima →
          </Link>
          <div className="ml-2 flex overflow-hidden rounded-md border border-linha">
            <Link
              href={`/app/agenda?data=${data}&visao=dia`}
              className={`px-3 py-1 ${
                visao === "dia" ? "bg-latao text-carvao" : "text-carvao hover:bg-marfim"
              }`}
            >
              Dia
            </Link>
            <Link
              href={`/app/agenda?data=${data}&visao=semana`}
              className={`border-l border-linha px-3 py-1 ${
                visao === "semana" ? "bg-latao text-carvao" : "text-carvao hover:bg-marfim"
              }`}
            >
              Semana
            </Link>
          </div>
        </div>
      </div>

      {visao === "dia" ? (
        <AgendaClient
          data={data}
          profissionais={profissionais ?? []}
          servicos={servicos ?? []}
          clientes={clientes ?? []}
          agendamentosPorProfissional={{ ...Object.groupBy(detalhados, (a) => a.profissional_id) }}
          podeReembolsar={papel === "owner"}
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => somarDias(inicioDaSemana(data), i)).map((dia) => (
            <div key={dia} className="flex flex-col gap-2 rounded-md border border-linha bg-marfim-2 p-2">
              <Link href={`/app/agenda?data=${dia}&visao=dia`} className="text-sm font-medium text-latao-escuro underline">
                {DIAS_SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()]} {dia.slice(8)}
              </Link>
              {detalhados
                .filter((ag) => dataLocal(ag.inicio, estabelecimento.timezone) === dia)
                .map((ag) => (
                  <div key={ag.id} className="rounded-sm bg-marfim p-1 text-xs text-carvao">
                    <p>{new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p>{ag.cliente_nome}</p>
                    <p className="text-cinza-600">{STATUS_LABEL[ag.status]}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
