import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { devolverEstoquePedido } from "@/lib/estoque";

type PagamentoParaTransicao = {
  id: string;
  agendamento_id: string | null;
  pedido_id: string | null;
  assinatura_cliente_id: string | null;
};

export type ResultadoPagamentoWebhook = "pago" | "falhou" | "estornado";

/**
 * Aplica o resultado de um pagamento (ja reconsultado na API do gateway, nunca confiando so no
 * corpo do webhook) nas tabelas de dominio -- compartilhado entre os webhooks de cada gateway
 * pra nao duplicar essa cascata (agendamento/pedido/assinatura) em cada um.
 */
export async function aplicarResultadoPagamento(
  supabase: SupabaseClient<Database>,
  pagamento: PagamentoParaTransicao,
  resultado: ResultadoPagamentoWebhook
): Promise<void> {
  if (resultado === "pago") {
    await supabase
      .from("pagamentos")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", pagamento.id);
    if (pagamento.agendamento_id) {
      await supabase.from("agendamentos").update({ status: "confirmado" }).eq("id", pagamento.agendamento_id);
    }
    if (pagamento.pedido_id) {
      await supabase.from("pedidos").update({ status: "aguardando_retirada" }).eq("id", pagamento.pedido_id);
    }
    if (pagamento.assinatura_cliente_id) {
      const cicloFim = new Date();
      cicloFim.setDate(cicloFim.getDate() + 30);
      await supabase
        .from("assinaturas_clientes")
        .update({
          status: "ativa",
          ciclo_inicio: new Date().toISOString(),
          ciclo_fim: cicloFim.toISOString(),
          usos_ciclo: {},
        })
        .eq("id", pagamento.assinatura_cliente_id);
    }
    return;
  }

  if (resultado === "falhou") {
    await supabase.from("pagamentos").update({ status: "falhou" }).eq("id", pagamento.id);
    if (pagamento.pedido_id) {
      await devolverEstoquePedido(supabase, pagamento.pedido_id);
      await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", pagamento.pedido_id);
    }
    if (pagamento.assinatura_cliente_id) {
      await supabase.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", pagamento.assinatura_cliente_id);
    }
    return;
  }

  // estornado
  await supabase.from("pagamentos").update({ status: "estornado" }).eq("id", pagamento.id);
  if (pagamento.assinatura_cliente_id) {
    await supabase.from("assinaturas_clientes").update({ status: "cancelada" }).eq("id", pagamento.assinatura_cliente_id);
  }
}
