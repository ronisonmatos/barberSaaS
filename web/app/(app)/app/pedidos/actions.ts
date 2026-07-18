"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { devolverEstoquePedido } from "@/lib/estoque";

export async function marcarPedidoRetirado(pedidoId: string): Promise<{ error?: string }> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, status")
    .eq("id", pedidoId)
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!pedido) return { error: "Pedido não encontrado." };
  if (pedido.status !== "aguardando_retirada") {
    return { error: "Só é possível marcar como retirado um pedido aguardando retirada." };
  }

  await supabase.from("pedidos").update({ status: "retirado" }).eq("id", pedidoId);
  revalidatePath("/app/pedidos");
  return {};
}

export async function cancelarPedido(pedidoId: string): Promise<{ error?: string }> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, status")
    .eq("id", pedidoId)
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!pedido) return { error: "Pedido não encontrado." };
  if (pedido.status === "retirado" || pedido.status === "cancelado") {
    return { error: "Esse pedido já não pode ser cancelado." };
  }

  await devolverEstoquePedido(supabase, pedidoId);
  await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", pedidoId);
  await supabase
    .from("pagamentos")
    .update({ status: "cancelado" })
    .eq("pedido_id", pedidoId)
    .eq("status", "pendente");

  revalidatePath("/app/pedidos");
  return {};
}
