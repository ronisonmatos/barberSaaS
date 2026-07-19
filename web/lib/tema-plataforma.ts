import "server-only";
import type { createServiceRoleClient } from "@/lib/supabase/service-role";

/** Confirma a compra avulsa de um tema já aprovada: marca o pagamento como pago e registra
 * a compra em estabelecimento_temas_comprados (liberando o tema pra sempre, sem recorrência). */
export async function confirmarCompraTema(
  supabase: ReturnType<typeof createServiceRoleClient>,
  pagamento: { id: string; estabelecimento_id: string; tema_plataforma_id: string }
) {
  await supabase
    .from("pagamentos_plataforma")
    .update({ status: "pago", pago_em: new Date().toISOString() })
    .eq("id", pagamento.id);

  await supabase.from("estabelecimento_temas_comprados").upsert(
    {
      estabelecimento_id: pagamento.estabelecimento_id,
      tema_plataforma_id: pagamento.tema_plataforma_id,
      pagamento_plataforma_id: pagamento.id,
    },
    { onConflict: "estabelecimento_id,tema_plataforma_id" }
  );
}
