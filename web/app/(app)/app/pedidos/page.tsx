import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { PedidosClient } from "./pedidos-client";
import { Heading } from "@/components/ui/heading";

export default async function PedidosPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [{ data: pedidos }, { data: itensData }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, status, total_centavos, created_at, agendamento_id, clientes(nome, telefone)")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pedido_itens")
      .select("pedido_id, nome_produto, quantidade, preco_unitario_centavos, pedidos!inner(estabelecimento_id)")
      .eq("pedidos.estabelecimento_id", estabelecimento.id),
  ]);

  const itensPorPedido: Record<
    string,
    { nome_produto: string; quantidade: number; preco_unitario_centavos: number }[]
  > = {};
  for (const item of itensData ?? []) {
    (itensPorPedido[item.pedido_id] ??= []).push({
      nome_produto: item.nome_produto,
      quantidade: item.quantidade,
      preco_unitario_centavos: item.preco_unitario_centavos,
    });
  }

  const lista = (pedidos ?? []).map((p) => ({
    id: p.id,
    status: p.status,
    totalCentavos: p.total_centavos,
    createdAt: p.created_at,
    combinadoComAgendamento: p.agendamento_id !== null,
    clienteNome: p.clientes?.nome ?? "—",
    clienteTelefone: p.clientes?.telefone ?? "",
    itens: itensPorPedido[p.id] ?? [],
  }));

  return (
    <div className="flex flex-col gap-4">
      <Heading>Pedidos</Heading>
      <PedidosClient pedidos={lista} />
    </div>
  );
}
