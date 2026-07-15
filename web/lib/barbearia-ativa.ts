import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Barbearia = Database["public"]["Tables"]["barbearias"]["Row"];

/**
 * Simplificação da onda 1: um usuário owner só pode ter 1 barbearia (garantido pela RPC de
 * onboarding), então "barbearia ativa" é sempre a única barbearia vinculada ao usuário.
 */
export async function getBarbeariaAtiva(): Promise<{
  userId: string;
  papel: "owner" | "staff";
  barbearia: Barbearia;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membro } = await supabase
    .from("membros_barbearia")
    .select("papel, barbearias(*)")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro || !membro.barbearias) redirect("/onboarding");

  return { userId: user.id, papel: membro.papel, barbearia: membro.barbearias };
}
