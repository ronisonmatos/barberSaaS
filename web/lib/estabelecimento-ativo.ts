import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];

/**
 * Simplificação da onda 1: um usuário owner só pode ter 1 estabelecimento (garantido pela RPC de
 * onboarding), então "estabelecimento ativo" é sempre o único estabelecimento vinculado ao usuário.
 */
export async function getEstabelecimentoAtivo(): Promise<{
  userId: string;
  papel: "owner" | "staff";
  estabelecimento: Estabelecimento;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membro } = await supabase
    .from("membros_estabelecimento")
    .select("papel, estabelecimentos(*)")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro || !membro.estabelecimentos) redirect("/onboarding");

  return { userId: user.id, papel: membro.papel, estabelecimento: membro.estabelecimentos };
}
