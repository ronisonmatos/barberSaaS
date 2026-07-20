import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];

export async function getSuperAdmin(): Promise<{ userId: string; nome: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("usuarios").select("nome, papel").eq("id", user.id).single();

  if (!perfil || perfil.papel !== "super_admin") redirect("/app");

  return { userId: user.id, nome: perfil.nome };
}

/**
 * Guarda usada pelo editor de pagina de demonstracao: alem de exigir super_admin, confirma que o
 * estabelecimento ainda esta em modo rascunho -- evita editar por engano um estabelecimento que
 * acabou de ser reivindicado com a aba ainda aberta (a RLS ja libera o super_admin nas tabelas de
 * conteudo independente disso, essa checagem e so defesa em profundidade a nivel de UI).
 */
export async function getSuperAdminERascunho(
  estabelecimentoId: string
): Promise<{ userId: string; estabelecimento: Estabelecimento }> {
  const { userId } = await getSuperAdmin();
  const supabase = await createClient();
  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("id", estabelecimentoId)
    .single();

  if (!estabelecimento || !estabelecimento.rascunho) {
    redirect(`/admin/estabelecimentos/${estabelecimentoId}`);
  }

  return { userId, estabelecimento };
}
