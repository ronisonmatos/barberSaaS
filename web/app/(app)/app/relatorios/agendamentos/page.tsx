import { CalendarCheck, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { centavosToBRL } from "@/lib/money";
import { plural } from "@/lib/plural";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { GraficoStatus } from "../../dashboard-charts";
import { periodoValido, calcularRangePeriodo } from "../../periodo";
import { PeriodoSeletor } from "../../periodo-seletor";

type Linha = {
  id: string;
  status: string;
  preco_centavos: number;
  servico_id: string | null;
  profissional_id: string | null;
  servicos: { nome: string } | null;
  profissionais: { nome: string } | null;
};

export default async function RelatorioAgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const params = await searchParams;
  const periodo = periodoValido(params.periodo);
  const { rangeInicio, rangeFim } = calcularRangePeriodo(periodo, estabelecimento.timezone);

  const { data } = await supabase
    .from("agendamentos")
    .select("id, status, preco_centavos, servico_id, profissional_id, servicos(nome), profissionais(nome)")
    .eq("estabelecimento_id", estabelecimento.id)
    .gte("inicio", rangeInicio.toISOString())
    .lt("inicio", rangeFim.toISOString());

  const lista = (data ?? []) as unknown as Linha[];
  const total = lista.length;
  const concluidos = lista.filter((a) => a.status === "concluido").length;
  const cancelados = lista.filter((a) => a.status === "cancelado").length;
  const naoCompareceram = lista.filter((a) => a.status === "no_show").length;
  const aAtender = lista.filter((a) => a.status === "pendente" || a.status === "confirmado").length;

  const dadosStatus = [
    { rotulo: "Atendidos", valor: concluidos, cor: "var(--sucesso)" },
    { rotulo: "A atender", valor: aAtender, cor: "var(--latao-escuro)" },
    { rotulo: "Cancelados", valor: cancelados, cor: "var(--cinza-600)" },
    { rotulo: "Não compareceram", valor: naoCompareceram, cor: "var(--erro)" },
  ];

  const porServico = new Map<string, { nome: string; agendamentos: number; faturamento: number }>();
  for (const a of lista) {
    if (!a.servico_id) continue;
    const atual = porServico.get(a.servico_id) ?? { nome: a.servicos?.nome ?? "—", agendamentos: 0, faturamento: 0 };
    atual.agendamentos += 1;
    if (a.status === "concluido") atual.faturamento += a.preco_centavos;
    porServico.set(a.servico_id, atual);
  }
  const rankingServicos = [...porServico.values()].sort((a, b) => b.agendamentos - a.agendamentos);

  const porProfissional = new Map<
    string,
    { nome: string; concluidos: number; cancelados: number; noShow: number; total: number }
  >();
  for (const a of lista) {
    if (!a.profissional_id) continue;
    const atual = porProfissional.get(a.profissional_id) ?? {
      nome: a.profissionais?.nome ?? "—",
      concluidos: 0,
      cancelados: 0,
      noShow: 0,
      total: 0,
    };
    atual.total += 1;
    if (a.status === "concluido") atual.concluidos += 1;
    if (a.status === "cancelado") atual.cancelados += 1;
    if (a.status === "no_show") atual.noShow += 1;
    porProfissional.set(a.profissional_id, atual);
  }
  const rankingProfissionais = [...porProfissional.values()].sort((a, b) => b.concluidos - a.concluidos);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-cinza-600">Detalhamento de agendamentos por serviço e por profissional.</p>
        <PeriodoSeletor periodo={periodo} basePath="/app/relatorios/agendamentos" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Agendados" value={total} icon={CalendarCheck} colorClassName="text-carvao" />
        <StatTile label="Atendidos" value={concluidos} icon={CalendarCheck} colorClassName="text-sucesso" />
        <StatTile label="A atender" value={aAtender} icon={CalendarCheck} colorClassName="text-latao-escuro" />
        <StatTile label="Cancelados" value={cancelados} icon={CalendarCheck} colorClassName="text-cinza-600" />
        <StatTile label="Não compareceram" value={naoCompareceram} icon={CalendarCheck} colorClassName="text-erro" />
      </div>

      {total === 0 ? (
        <EmptyState icon={ListChecks} titulo="Nenhum agendamento no período" />
      ) : (
        <GraficoStatus dados={dadosStatus} />
      )}

      <div className="flex flex-col gap-3">
        <Heading as="h2">Serviços mais agendados</Heading>
        {rankingServicos.length === 0 ? (
          <EmptyState icon={ListChecks} titulo="Nenhum serviço agendado no período" />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linha text-left text-xs text-cinza-600">
                  <th className="p-3 font-medium">Serviço</th>
                  <th className="p-3 font-medium">Agendamentos</th>
                  <th className="p-3 font-medium">Faturamento (concluídos)</th>
                </tr>
              </thead>
              <tbody>
                {rankingServicos.map((s) => (
                  <tr key={s.nome} className="border-b border-linha last:border-0">
                    <td className="p-3 font-medium text-carvao">{s.nome}</td>
                    <td className="p-3 text-cinza-600">
                      {s.agendamentos} {plural(s.agendamentos, "agendamento", "agendamentos")}
                    </td>
                    <td className="p-3 tabular-nums text-cinza-600">{centavosToBRL(s.faturamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Heading as="h2">Por profissional</Heading>
        {rankingProfissionais.length === 0 ? (
          <EmptyState icon={ListChecks} titulo="Nenhum profissional com agendamento no período" />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linha text-left text-xs text-cinza-600">
                  <th className="p-3 font-medium">Profissional</th>
                  <th className="p-3 font-medium">Atendidos</th>
                  <th className="p-3 font-medium">Cancelados</th>
                  <th className="p-3 font-medium">Não compareceu</th>
                </tr>
              </thead>
              <tbody>
                {rankingProfissionais.map((p) => (
                  <tr key={p.nome} className="border-b border-linha last:border-0">
                    <td className="p-3 font-medium text-carvao">{p.nome}</td>
                    <td className="p-3 tabular-nums text-cinza-600">{p.concluidos}</td>
                    <td className="p-3 tabular-nums text-cinza-600">{p.cancelados}</td>
                    <td className="p-3 tabular-nums text-cinza-600">{p.noShow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
