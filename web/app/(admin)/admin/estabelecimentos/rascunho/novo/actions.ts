"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";

export type FormState = { error?: string } | undefined;

const LAYOUTS_GRATIS = ["classico"];

const schema = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use apenas letras minúsculas, números e hífen." })
    .min(3, { error: "O endereço deve ter ao menos 3 caracteres." }),
  tema: z.enum(["classica", "moderna", "delicada"]),
  layout: z.string().min(1),
});

export async function criarPaginaDemonstracao(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await getSuperAdmin();

  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    tema: formData.get("tema"),
    layout: formData.get("layout"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  // Defesa em profundidade: mesmo padrão de salvarIdentidadeRascunho/salvarTemplate.
  if (!LAYOUTS_GRATIS.includes(parsed.data.layout)) {
    const { data: tema } = await supabase
      .from("temas_plataforma")
      .select("id")
      .eq("chave", parsed.data.layout)
      .eq("ativo", true)
      .eq("gratis", true)
      .maybeSingle();
    if (!tema) return { error: "Template inválido ou não é mais gratuito." };
  }

  const { data: estabelecimento, error: rpcError } = await supabase.rpc("admin_criar_estabelecimento_rascunho", {
    p_nome: parsed.data.nome,
    p_slug: parsed.data.slug,
  });

  if (rpcError || !estabelecimento) {
    if (rpcError?.message.includes("estabelecimentos_slug_key")) {
      return { error: "Esse endereço já está em uso, escolha outro." };
    }
    return { error: rpcError?.message ?? "Erro ao criar página de demonstração." };
  }

  await supabase
    .from("estabelecimentos")
    .update({
      config: { ...(estabelecimento.config as Record<string, unknown>), tema: parsed.data.tema, layout: parsed.data.layout },
    })
    .eq("id", estabelecimento.id);

  await supabase.from("eventos_admin").insert({
    estabelecimento_id: estabelecimento.id,
    super_admin_id: userId,
    tipo: "pagina_demonstracao_criada",
    detalhes: { nome: parsed.data.nome, slug: parsed.data.slug, tema: parsed.data.tema, layout: parsed.data.layout },
  });

  revalidatePath("/admin/estabelecimentos");
  redirect(`/admin/estabelecimentos/${estabelecimento.id}/editar`);
}
