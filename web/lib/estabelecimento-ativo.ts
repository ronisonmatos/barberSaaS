import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoImpersonado } from "@/lib/modo-suporte";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];

/**
 * Simplificação da onda 1: um usuário owner só pode ter 1 estabelecimento (garantido pela RPC de
 * onboarding), então "estabelecimento ativo" é sempre o único estabelecimento vinculado ao usuário.
 *
 * Exceção: modo suporte (super_admin "acessando como" um estabelecimento pra dar suporte, ver
 * web/lib/modo-suporte.ts) resolve o estabelecimento pelo cookie em vez de membros_estabelecimento
 * -- o super_admin nunca vira membro de verdade. `papel: "owner"` é devolvido de propósito nesse
 * caso pra liberar as mesmas telas/ações que o dono do estabelecimento teria; a escrita real nas
 * tabelas de domínio já é liberada pra super_admin via RLS (`... or eh_super_admin()`),
 * independente do que esse papel diz.
 */
export async function getEstabelecimentoAtivo(): Promise<{
  userId: string;
  usuarioNome: string;
  usuarioGenero: "masculino" | "feminino" | null;
  papel: "owner" | "staff";
  estabelecimento: Estabelecimento;
  modoSuporte: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const estabelecimentoImpersonadoId = await getEstabelecimentoImpersonado();
  if (estabelecimentoImpersonadoId) {
    const { data: perfil } = await supabase.from("usuarios").select("nome, genero, papel").eq("id", user.id).single();
    if (perfil?.papel === "super_admin") {
      const { data: estabelecimento } = await supabase
        .from("estabelecimentos")
        .select("*")
        .eq("id", estabelecimentoImpersonadoId)
        .maybeSingle();
      if (estabelecimento) {
        return {
          userId: user.id,
          usuarioNome: perfil.nome,
          usuarioGenero: perfil.genero,
          papel: "owner",
          estabelecimento,
          modoSuporte: true,
        };
      }
    }
  }

  const { data: membro } = await supabase
    .from("membros_estabelecimento")
    .select("papel, ativo, estabelecimentos(*), usuarios(nome, genero)")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) redirect("/onboarding");
  if (!membro.ativo) redirect("/conta-desativada");
  if (!membro.estabelecimentos) redirect("/onboarding");

  return {
    userId: user.id,
    usuarioNome: membro.usuarios?.nome ?? user.email ?? "",
    usuarioGenero: membro.usuarios?.genero ?? null,
    papel: membro.papel,
    estabelecimento: membro.estabelecimentos,
    modoSuporte: false,
  };
}
