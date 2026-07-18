import "server-only";
import type { createServiceRoleClient } from "@/lib/supabase/service-role";

const UM_MES_MS = 30 * 24 * 60 * 60 * 1000;

/** Confirma um pagamento de assinatura já aprovado: marca pago, ativa o estabelecimento no plano e
 * (re)inicia a assinatura na plataforma por +1 mês a partir de agora. */
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

  const { data: assinaturaExistente } = await supabase
    .from("assinaturas_plataforma")
    .select("id")
    .eq("estabelecimento_id", pagamento.estabelecimento_id)
    .maybeSingle();

  if (assinaturaExistente) {
    await supabase
      .from("assinaturas_plataforma")
      .update({
        plano_plataforma_id: pagamento.plano_plataforma_id,
        status: "ativa",
        proximo_vencimento: proximoVencimento,
      })
      .eq("id", assinaturaExistente.id);
  } else {
    await supabase.from("assinaturas_plataforma").insert({
      estabelecimento_id: pagamento.estabelecimento_id,
      plano_plataforma_id: pagamento.plano_plataforma_id,
      status: "ativa",
      proximo_vencimento: proximoVencimento,
    });
  }
}
