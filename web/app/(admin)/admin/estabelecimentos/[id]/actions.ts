"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getSuperAdmin, getSuperAdminERascunho } from "@/lib/admin-guard";

type StatusEstabelecimento = "trial" | "ativa" | "inadimplente" | "suspensa" | "cancelada";

export async function alterarStatusEstabelecimento(estabelecimentoId: string, novoStatus: StatusEstabelecimento) {
  const { userId } = await getSuperAdmin();
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("estabelecimentos")
    .select("status")
    .eq("id", estabelecimentoId)
    .single();

  const { error } = await supabase
    .from("estabelecimentos")
    .update({ status: novoStatus, ativacao_manual: true })
    .eq("id", estabelecimentoId);
  if (error) throw new Error(error.message);

  await supabase.from("eventos_admin").insert({
    estabelecimento_id: estabelecimentoId,
    super_admin_id: userId,
    tipo: "status_alterado",
    detalhes: { de: atual?.status, para: novoStatus },
  });

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}`);
  revalidatePath("/admin/estabelecimentos");
  revalidatePath("/admin");
}

export async function liberarControleAutomatico(estabelecimentoId: string) {
  const { userId } = await getSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("estabelecimentos")
    .update({ ativacao_manual: false })
    .eq("id", estabelecimentoId);
  if (error) throw new Error(error.message);

  await supabase.from("eventos_admin").insert({
    estabelecimento_id: estabelecimentoId,
    super_admin_id: userId,
    tipo: "ativacao_manual_liberada",
    detalhes: {},
  });

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}`);
}

export async function alterarPlanoEstabelecimento(estabelecimentoId: string, planoId: string) {
  const { userId } = await getSuperAdmin();
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("estabelecimentos")
    .select("plano_plataforma_id")
    .eq("id", estabelecimentoId)
    .single();

  const { error } = await supabase
    .from("estabelecimentos")
    .update({ plano_plataforma_id: planoId })
    .eq("id", estabelecimentoId);
  if (error) throw new Error(error.message);

  await supabase.rpc("aplicar_limites_plano", { p_estabelecimento_id: estabelecimentoId });

  // Mantem assinaturas_plataforma consistente com a troca manual, com o mesmo efeito de +1 mes de
  // vencimento que uma renovacao paga teria (ver confirmarPagamentoPlataforma).
  const proximoVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: assinaturaExistente } = await supabase
    .from("assinaturas_plataforma")
    .select("id")
    .eq("estabelecimento_id", estabelecimentoId)
    .maybeSingle();

  if (assinaturaExistente) {
    await supabase
      .from("assinaturas_plataforma")
      .update({ plano_plataforma_id: planoId, status: "ativa", proximo_vencimento: proximoVencimento })
      .eq("id", assinaturaExistente.id);
  } else {
    await supabase.from("assinaturas_plataforma").insert({
      estabelecimento_id: estabelecimentoId,
      plano_plataforma_id: planoId,
      status: "ativa",
      proximo_vencimento: proximoVencimento,
    });
  }

  await supabase.from("eventos_admin").insert({
    estabelecimento_id: estabelecimentoId,
    super_admin_id: userId,
    tipo: "plano_alterado",
    detalhes: { plano_anterior_id: atual?.plano_plataforma_id, plano_novo_id: planoId },
  });

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}`);
}

export type ConvidarDonoRascunhoState = { error?: string } | undefined;

const schemaConvidarDono = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function convidarDonoRascunho(
  _prevState: ConvidarDonoRascunhoState,
  formData: FormData
): Promise<ConvidarDonoRascunhoState> {
  const estabelecimentoId = formData.get("estabelecimentoId") as string;
  const { userId } = await getSuperAdminERascunho(estabelecimentoId);

  const parsed = schemaConvidarDono.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const serviceRole = createServiceRoleClient();
  const { data: convidado, error: inviteError } = await serviceRole.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { nome: parsed.data.nome },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/definir-senha`,
    }
  );
  if (inviteError) {
    return { error: `Erro ao convidar: ${inviteError.message}` };
  }

  const supabase = await createClient();
  const { error: rpcError } = await supabase.rpc("admin_reivindicar_rascunho", {
    p_estabelecimento_id: estabelecimentoId,
    p_owner_id: convidado.user.id,
  });
  if (rpcError) {
    return { error: rpcError.message };
  }

  await supabase.from("eventos_admin").insert({
    estabelecimento_id: estabelecimentoId,
    super_admin_id: userId,
    tipo: "pagina_demonstracao_reivindicada",
    detalhes: { nome: parsed.data.nome, email: parsed.data.email },
  });

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}`);
  revalidatePath("/admin/estabelecimentos");
  return undefined;
}
