"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getSuperAdmin } from "@/lib/admin-guard";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use apenas letras minúsculas, números e hífen." })
    .min(3, { error: "O endereço deve ter ao menos 3 caracteres." }),
  nomeDono: z.string().trim().min(2, { error: "Nome do dono deve ter ao menos 2 caracteres." }),
  emailDono: z.email({ error: "Informe um e-mail válido." }),
});

export async function cadastrarEstabelecimentoManualmente(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { userId } = await getSuperAdmin();

  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    nomeDono: formData.get("nomeDono"),
    emailDono: formData.get("emailDono"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const serviceRole = createServiceRoleClient();
  const { data: convidado, error: inviteError } = await serviceRole.auth.admin.inviteUserByEmail(
    parsed.data.emailDono,
    { data: { nome: parsed.data.nomeDono } }
  );
  if (inviteError) {
    return { error: `Erro ao convidar o dono: ${inviteError.message}` };
  }

  const supabase = await createClient();
  const { data: estabelecimento, error: rpcError } = await supabase.rpc("admin_criar_estabelecimento", {
    p_nome: parsed.data.nome,
    p_slug: parsed.data.slug,
    p_owner_id: convidado.user.id,
  });

  if (rpcError || !estabelecimento) {
    if (rpcError?.message.includes("estabelecimentos_slug_key")) {
      return { error: "Esse endereço já está em uso, escolha outro." };
    }
    return { error: rpcError?.message ?? "Erro ao criar estabelecimento." };
  }

  await supabase.from("eventos_admin").insert({
    estabelecimento_id: estabelecimento.id,
    super_admin_id: userId,
    tipo: "estabelecimento_criado_manualmente",
    detalhes: { nome: parsed.data.nome, slug: parsed.data.slug, email_dono: parsed.data.emailDono },
  });

  revalidatePath("/admin/estabelecimentos");
  redirect(`/admin/estabelecimentos/${estabelecimento.id}`);
}
