import { Package, AlertTriangle } from "lucide-react";
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

const LIMITE_ESTOQUE_BAIXO = 5;

export default async function RelatorioProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const params = await searchParams;
  const periodo = periodoValido(params.periodo);
  const { rangeInicio, rangeFim } = calcularRangePeriodo(periodo, estabelecimento.timezone);

  const [{ data: pedidos }, { data: produtos }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id")
      .eq("estabelecimento_id", estabelecimento.id)
      .neq("status", "cancelado")
      .gte("created_at", rangeInicio.toISOString())
      .lt("created_at", rangeFim.toISOString()),
    supabase.from("produtos").select("id, nome, estoque, ativo").eq("estabelecimento_id", estabelecimento.id).order("nome"),
  ]);

  const idsPedidos = (pedidos ?? []).map((p) => p.id);
  const { data: itens } = idsPedidos.length
    ? await supabase.from("pedido_itens").select("nome_produto, quantidade, preco_unitario_centavos").in("pedido_id", idsPedidos)
    : { data: [] };
  const listaItens = itens ?? [];
  const listaProdutos = produtos ?? [];

  const porProduto = new Map<string, { quantidade: number; receita: number }>();
  for (const i of listaItens) {
    const atual = porProduto.get(i.nome_produto) ?? { quantidade: 0, receita: 0 };
    atual.quantidade += i.quantidade;
    atual.receita += i.quantidade * i.preco_unitario_centavos;
    porProduto.set(i.nome_produto, atual);
  }
  const ranking = [...porProduto.entries()]
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.receita - a.receita);

  const totalReceita = ranking.reduce((soma, r) => soma + r.receita, 0);
  const totalQuantidade = ranking.reduce((soma, r) => soma + r.quantidade, 0);
  const estoqueBaixo = listaProdutos.filter((p) => p.ativo && p.estoque <= LIMITE_ESTOQUE_BAIXO);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-cinza-600">Vendas por produto no período e estoque atual.</p>
        <PeriodoSeletor periodo={periodo} basePath="/app/relatorios/produtos" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Receita de produtos" value={centavosToBRL(totalReceita)} icon={Package} colorClassName="text-carvao" />
        <StatTile label="Itens vendidos" value={totalQuantidade} icon={Package} colorClassName="text-latao-escuro" />
        <StatTile
          label="Estoque baixo"
          value={estoqueBaixo.length}
          icon={AlertTriangle}
          colorClassName={estoqueBaixo.length > 0 ? "text-erro" : "text-carvao"}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Heading as="h2">Mais vendidos</Heading>
        {ranking.length === 0 ? (
          <EmptyState icon={Package} titulo="Nenhuma venda de produto no período" />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linha text-left text-xs text-cinza-600">
                  <th className="p-3 font-medium">Produto</th>
                  <th className="p-3 font-medium">Quantidade vendida</th>
                  <th className="p-3 font-medium">Receita</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.nome} className="border-b border-linha last:border-0">
                    <td className="p-3 font-medium text-carvao">{r.nome}</td>
                    <td className="p-3 tabular-nums text-cinza-600">
                      {r.quantidade} {plural(r.quantidade, "unidade", "unidades")}
                    </td>
                    <td className="p-3 tabular-nums text-cinza-600">{centavosToBRL(r.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Heading as="h2">Estoque atual</Heading>
        {listaProdutos.length === 0 ? (
          <EmptyState icon={Package} titulo="Nenhum produto cadastrado" />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linha text-left text-xs text-cinza-600">
                  <th className="p-3 font-medium">Produto</th>
                  <th className="p-3 font-medium">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {listaProdutos.map((p) => (
                  <tr key={p.id} className="border-b border-linha last:border-0">
                    <td className="p-3 font-medium text-carvao">
                      {p.nome}
                      {!p.ativo && <span className="ml-2 text-xs text-cinza-300">(inativo)</span>}
                    </td>
                    <td className={`p-3 tabular-nums ${p.ativo && p.estoque <= LIMITE_ESTOQUE_BAIXO ? "font-medium text-erro" : "text-cinza-600"}`}>
                      {p.estoque}
                    </td>
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
