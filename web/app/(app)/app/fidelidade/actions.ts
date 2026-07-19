"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function resgatarCartaoFidelidade(cartaoId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("resgatar_cartao_fidelidade", { p_cartao_id: cartaoId });
  if (error) return { error: error.message };

  revalidatePath("/app/fidelidade");
  return {};
}
