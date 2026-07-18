import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** Devolve ao estoque a quantidade de cada item de um pedido cancelado (pagamento falhou/expirou). */
export async function devolverEstoquePedido(supabase: SupabaseClient<Database>, pedidoId: string) {
  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, quantidade")
    .eq("pedido_id", pedidoId);

  for (const item of itens ?? []) {
    await supabase.rpc("incrementar_estoque_produto", {
      p_produto_id: item.produto_id,
      p_quantidade: item.quantidade,
    });
  }
}
