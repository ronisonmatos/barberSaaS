import Link from "next/link";
import { CalendarCheck, CheckCheck, Clock, X, UserX, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { hojeNaTimezone, dataLocal, limitesDoDiaUTC, somarDias } from "@/lib/timezone";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { GraficoStatus, GraficoVolumeDiario } from "./dashboard-charts";

const PERIODOS = {
  hoje: { label: "Hoje", dias: 1 },
  "7d": { label: "7 dias", dias: 7 },
  "30d": { label: "30 dias", dias: 30 },
} as const;

type PeriodoKey = keyof typeof PERIODOS;

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const params = await searchParams;
  const periodo: PeriodoKey = params.periodo && params.periodo in PERIODOS ? (params.periodo as PeriodoKey) : "30d";

  const hoje = hojeNaTimezone(estabelecimento.timezone);
  const primeiroDia = somarDias(hoje, -(PERIODOS[periodo].dias - 1));
  const rangeInicio = limitesDoDiaUTC(primeiroDia, estabelecimento.timezone).inicio;
  const rangeFim = limitesDoDiaUTC(hoje, estabelecimento.timezone).fim;

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, status, inicio")
    .eq("estabelecimento_id", estabelecimento.id)
    .gte("inicio", rangeInicio.toISOString())
    .lt("inicio", rangeFim.toISOString());

  const lista = agendamentos ?? [];
  const total = lista.length;
  const concluidos = lista.filter((a) => a.status === "concluido").length;
  const aAtender = lista.filter((a) => a.status === "pendente" || a.status === "confirmado").length;
  const cancelados = lista.filter((a) => a.status === "cancelado").length;
  const naoCompareceram = lista.filter((a) => a.status === "no_show").length;

  const diasDoPeriodo = Array.from({ length: PERIODOS[periodo].dias }, (_, i) => somarDias(primeiroDia, i));
  const contagemPorDia = new Map(diasDoPeriodo.map((dia) => [dia, 0]));
  for (const a of lista) {
    const dia = dataLocal(a.inicio, estabelecimento.timezone);
    contagemPorDia.set(dia, (contagemPorDia.get(dia) ?? 0) + 1);
  }
  const dadosVolume = diasDoPeriodo.map((dia) => ({
    rotulo: new Date(`${dia}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    valor: contagemPorDia.get(dia) ?? 0,
  }));

  const dadosStatus = [
    { rotulo: "Atendidos", valor: concluidos, cor: "var(--sucesso)" },
    { rotulo: "A atender", valor: aAtender, cor: "var(--latao-escuro)" },
    { rotulo: "Cancelados", valor: cancelados, cor: "var(--cinza-600)" },
    { rotulo: "Não compareceram", valor: naoCompareceram, cor: "var(--erro)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-carvao">Painel</h1>
        <div className="flex gap-1 rounded-md border border-linha bg-marfim-2 p-1 text-sm">
          {(Object.keys(PERIODOS) as PeriodoKey[]).map((chave) => (
            <Link
              key={chave}
              href={`/app?periodo=${chave}`}
              aria-current={periodo === chave ? "page" : undefined}
              className={`rounded-sm px-3 py-1.5 transition-colors duration-150 ${
                periodo === chave ? "bg-latao text-carvao" : "text-cinza-600 hover:text-carvao"
              }`}
            >
              {PERIODOS[chave].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Agendados" value={total} icon={CalendarCheck} colorClassName="text-carvao" />
        <StatTile label="Atendidos" value={concluidos} icon={CheckCheck} colorClassName="text-sucesso" />
        <StatTile label="A atender" value={aAtender} icon={Clock} colorClassName="text-latao-escuro" />
        <StatTile label="Cancelados" value={cancelados} icon={X} colorClassName="text-cinza-600" />
        <StatTile label="Não compareceram" value={naoCompareceram} icon={UserX} colorClassName="text-erro" />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={BarChart3}
          titulo="Nenhum agendamento no período"
          descricao="Os gráficos aparecem assim que houver agendamentos nesse intervalo."
          acao={{ label: "Ver agenda", href: "/app/agenda" }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <GraficoStatus dados={dadosStatus} />
          <GraficoVolumeDiario dados={dadosVolume} />
        </div>
      )}
    </div>
  );
}
