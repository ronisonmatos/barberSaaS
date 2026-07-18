import "server-only";
import type { createServiceRoleClient } from "@/lib/supabase/service-role";
import { calcularTravaPromocional } from "@/lib/planos";

const UM_MES_MS = 30 * 24 * 60 * 60 * 1000;

/** Confirma um pagamento de assinatura já aprovado: marca pago, ativa o estabelecimento no plano e
 * (re)inicia a assinatura na plataforma por +1 mês a partir de agora. Também trava (ou limpa) o
 * preço promocional na assinatura, já que a renovação é uma cobrança manual, não recorrente. */
export async function confirmarPagamentoPlataforma(
  supabase: ReturnType<typeof createServiceRoleClient>,
  pagamento: { id: string; estabelecimento_id: string; plano_plataforma_id: string }
) {
  const proximoVencimento = new Date(Date.now() + UM_MES_MS).toISOString().slice(0, 10);

  await supabase
    .from("pagamentos_plataforma")
    .update({ status: "pago", pago_em: new Date().toISOString() })
    .eq("id", pagamento.id);

  await supabase
    .from("estabelecimentos")
    .update({ plano_plataforma_id: pagamento.plano_plataforma_id, status: "ativa" })
    .eq("id", pagamento.estabelecimento_id);

  await supabase.rpc("aplicar_limites_plano", { p_estabelecimento_id: pagamento.estabelecimento_id });

  const [{ data: plano }, { data: assinaturaExistente }] = await Promise.all([
    supabase.from("planos_plataforma").select("*").eq("id", pagamento.plano_plataforma_id).single(),
    supabase
      .from("assinaturas_plataforma")
      .select("id, plano_plataforma_id, preco_promocional_centavos, preco_promocional_ate")
      .eq("estabelecimento_id", pagamento.estabelecimento_id)
      .maybeSingle(),
  ]);

  const trava = plano ? calcularTravaPromocional(plano, assinaturaExistente ?? null) : {
    preco_promocional_centavos: null,
    preco_promocional_ate: null,
  };

  if (assinaturaExistente) {
    await supabase
      .from("assinaturas_plataforma")
      .update({
        plano_plataforma_id: pagamento.plano_plataforma_id,
        status: "ativa",
        proximo_vencimento: proximoVencimento,
        ...trava,
      })
      .eq("id", assinaturaExistente.id);
  } else {
    await supabase.from("assinaturas_plataforma").insert({
      estabelecimento_id: pagamento.estabelecimento_id,
      plano_plataforma_id: pagamento.plano_plataforma_id,
      status: "ativa",
      proximo_vencimento: proximoVencimento,
      ...trava,
    });
  }
}
