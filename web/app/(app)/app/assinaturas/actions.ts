"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

export async function cancelarAssinatura(assinaturaId: string): Promise<{ error?: string }> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") {
    return { error: "Somente o dono do estabelecimento cancela assinaturas." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assinaturas_clientes")
    .update({ status: "cancelada" })
    .eq("id", assinaturaId)
    .eq("estabelecimento_id", estabelecimento.id);
  if (error) return { error: error.message };

  revalidatePath("/app/assinaturas");
  return {};
}
