import type { LucideIcon } from "lucide-react";
import { Wallet, Scissors, Undo2, Receipt, QrCode, CreditCard, Banknote, Store, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { centavosToBRL } from "@/lib/money";
import { plural } from "@/lib/plural";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { periodoValido, calcularRangePeriodo } from "../../periodo";
import { PeriodoSeletor } from "../../periodo-seletor";

const METODO_INFO: Record<string, { label: string; icon: LucideIcon; cor: string }> = {
  pix: { label: "Pix", icon: QrCode, cor: "var(--latao-escuro)" },
  cartao: { label: "Cartão", icon: CreditCard, cor: "var(--sucesso)" },
  dinheiro: { label: "Dinheiro", icon: Banknote, cor: "var(--cinza-600)" },
  no_local: { label: "No local", icon: Store, cor: "var(--carvao)" },
  assinatura: { label: "Assinatura", icon: Repeat, cor: "var(--latao)" },
};

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa o relatório Financeiro.</Card>;
  }

  const supabase = await createClient();
  const params = await searchParams;
  const periodo = periodoValido(params.periodo);
  const { rangeInicio, rangeFim } = calcularRangePeriodo(periodo, estabelecimento.timezone);

  const [{ data: agendamentos }, { data: pagamentos }, { data: profissionais }, { data: pedidos }] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("id, preco_centavos, profissional_id")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("status", "concluido")
      .gte("inicio", rangeInicio.toISOString())
      .lt("inicio", rangeFim.toISOString()),
    supabase
      .from("pagamentos")
      .select("metodo, valor_centavos, status")
      .eq("estabelecimento_id", estabelecimento.id)
      .gte("pago_em", rangeInicio.toISOString())
      .lt("pago_em", rangeFim.toISOString()),
    supabase.from("profissionais").select("id, nome, comissao_percentual").eq("estabelecimento_id", estabelecimento.id),
    supabase
      .from("pedidos")
      .select("id")
      .eq("estabelecimento_id", estabelecimento.id)
      .neq("status", "cancelado")
      .gte("created_at", rangeInicio.toISOString())
      .lt("created_at", rangeFim.toISOString()),
  ]);

  const listaAgendamentos = agendamentos ?? [];
  const listaPagamentos = pagamentos ?? [];
  const listaProfissionais = profissionais ?? [];
  const idsPedidos = (pedidos ?? []).map((p) => p.id);

  const { data: pedidoItens } = idsPedidos.length
    ? await supabase.from("pedido_itens").select("quantidade, preco_unitario_centavos").in("pedido_id", idsPedidos)
    : { data: [] };
  const listaItens = pedidoItens ?? [];

  const receitaServicos = listaAgendamentos.reduce((soma, a) => soma + a.preco_centavos, 0);
  const receitaProdutos = listaItens.reduce((soma, i) => soma + i.quantidade * i.preco_unitario_centavos, 0);
  const ticketMedio = listaAgendamentos.length > 0 ? Math.round(receitaServicos / listaAgendamentos.length) : 0;

  const pagos = listaPagamentos.filter((p) => p.status === "pago");
  const estornados = listaPagamentos.filter((p) => p.status === "estornado");
  const totalRecebidoOnline = pagos.reduce((soma, p) => soma + p.valor_centavos, 0);
  const totalEstornado = estornados.reduce((soma, p) => soma + p.valor_centavos, 0);

  const porMetodo = new Map<string, number>();
  for (const p of pagos) {
    porMetodo.set(p.metodo, (porMetodo.get(p.metodo) ?? 0) + p.valor_centavos);
  }

  const porProfissional = new Map<string, { atendimentos: number; faturamento: number }>();
  for (const a of listaAgendamentos) {
    if (!a.profissional_id) continue;
    const atual = porProfissional.get(a.profissional_id) ?? { atendimentos: 0, faturamento: 0 };
    atual.atendimentos += 1;
    atual.faturamento += a.preco_centavos;
    porProfissional.set(a.profissional_id, atual);
  }
  const comissoes = listaProfissionais
    .map((prof) => {
      const dados = porProfissional.get(prof.id) ?? { atendimentos: 0, faturamento: 0 };
      const comissaoValor = Math.round((dados.faturamento * prof.comissao_percentual) / 100);
      return { ...prof, ...dados, comissaoValor };
    })
    .filter((c) => c.atendimentos > 0)
    .sort((a, b) => b.comissaoValor - a.comissaoValor);
  const totalComissoes = comissoes.reduce((soma, c) => soma + c.comissaoValor, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-cinza-600">Faturamento de serviços concluídos, produtos vendidos e comissão por profissional.</p>
        <PeriodoSeletor periodo={periodo} basePath="/app/relatorios/financeiro" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Faturamento total"
          value={centavosToBRL(receitaServicos + receitaProdutos)}
          icon={Wallet}
          colorClassName="text-carvao"
        />
        <StatTile label="Serviços concluídos" value={centavosToBRL(receitaServicos)} icon={Scissors} colorClassName="text-latao-escuro" />
        <StatTile label="Comissões a pagar" value={centavosToBRL(totalComissoes)} icon={Receipt} colorClassName="text-latao-escuro" />
        <StatTile label="Reembolsos" value={centavosToBRL(totalEstornado)} icon={Undo2} colorClassName="text-erro" />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <Heading as="h2">Comissão por profissional</Heading>
          <p className="text-xs text-cinza-300">
            Calculada sobre o valor dos serviços concluídos no período (preço de tabela no momento do agendamento), pela % de
            comissão cadastrada em cada profissional.
          </p>
        </div>
        {comissoes.length === 0 ? (
          <EmptyState icon={Receipt} titulo="Nenhum atendimento concluído no período" />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linha text-left text-xs text-cinza-600">
                  <th className="p-3 font-medium">Profissional</th>
                  <th className="p-3 font-medium">Atendimentos</th>
                  <th className="p-3 font-medium">Faturamento gerado</th>
                  <th className="p-3 font-medium">% comissão</th>
                  <th className="p-3 font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {comissoes.map((c) => (
                  <tr key={c.id} className="border-b border-linha last:border-0">
                    <td className="p-3 font-medium text-carvao">{c.nome}</td>
                    <td className="p-3 text-cinza-600">
                      {c.atendimentos} {plural(c.atendimentos, "atendimento", "atendimentos")}
                    </td>
                    <td className="p-3 tabular-nums text-cinza-600">{centavosToBRL(c.faturamento)}</td>
                    <td className="p-3 tabular-nums text-cinza-600">{c.comissao_percentual}%</td>
                    <td className="p-3 font-medium tabular-nums text-carvao">{centavosToBRL(c.comissaoValor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <Heading as="h2">Pagamentos registrados no sistema</Heading>
          <p className="text-xs text-cinza-300">
            Só cobre pagamentos feitos online (Pix, cartão, cobrança de assinatura) — diferente do faturamento de serviços
            acima, que conta também o que é recebido presencialmente e ainda não passa pelo sistema de pagamento.
          </p>
        </div>
        {pagos.length === 0 ? (
          <EmptyState icon={Wallet} titulo="Nenhum pagamento online registrado no período" />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Total recebido online" value={centavosToBRL(totalRecebidoOnline)} icon={Wallet} colorClassName="text-carvao" />
            {[...porMetodo.entries()].map(([metodo, valor]) => {
              const info = METODO_INFO[metodo] ?? { label: metodo, icon: Wallet, cor: "" };
              return (
                <StatTile key={metodo} label={info.label} value={centavosToBRL(valor)} icon={info.icon} colorClassName="text-latao-escuro" />
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Faturamento de produtos" value={centavosToBRL(receitaProdutos)} icon={Store} colorClassName="text-carvao" />
        <StatTile
          label="Ticket médio (serviço)"
          value={listaAgendamentos.length > 0 ? centavosToBRL(ticketMedio) : "—"}
          icon={Wallet}
          colorClassName="text-carvao"
        />
      </div>
    </div>
  );
}
