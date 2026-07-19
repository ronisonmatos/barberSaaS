"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";
import { brlToCentavos } from "@/lib/money";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "@/app/(app)/app/configuracoes/limites";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  id: z.string().uuid().optional(),
  chave: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, { error: "Use apenas letras minúsculas, números e hífen." }),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  descricao: z.string().trim().optional(),
  preco: z.string().min(1, { error: "Informe o preço." }),
  gratis: z.boolean(),
});

export async function salvarTema(_prevState: FormState, formData: FormData): Promise<FormState> {
  await getSuperAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    chave: formData.get("chave"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    preco: formData.get("preco"),
    gratis: formData.get("gratis") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const preco_centavos = brlToCentavos(parsed.data.preco);
  if (!Number.isFinite(preco_centavos) || preco_centavos < 0) {
    return { error: "Preço inválido." };
  }

  const supabase = await createClient();
  const payload = {
    chave: parsed.data.chave,
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    preco_centavos,
    gratis: parsed.data.gratis,
  };

  const { error } = parsed.data.id
    ? await supabase.from("temas_plataforma").update(payload).eq("id", parsed.data.id)
    : await supabase.from("temas_plataforma").insert(payload);

  if (error) {
    if (error.message.includes("temas_plataforma_chave_key")) {
      return { error: "Já existe um tema com essa chave." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/temas");
  return undefined;
}

export async function alternarAtivoTema(id: string, ativo: boolean) {
  await getSuperAdmin();
  const supabase = await createClient();
  await supabase.from("temas_plataforma").update({ ativo }).eq("id", id);
  revalidatePath("/admin/temas");
}

export async function atualizarPreviewTema(_prevState: FormState, formData: FormData): Promise<FormState> {
  await getSuperAdmin();

  const temaId = formData.get("temaId");
  const arquivo = formData.get("preview");
  if (typeof temaId !== "string" || !temaId) return { error: "Tema inválido." };
  if (!(arquivo instanceof File) || arquivo.size === 0) return { error: "Escolha uma imagem." };
  if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) return { error: "Use PNG, JPEG, WEBP ou SVG." };
  if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) return { error: "Imagem muito grande (máx. 5MB)." };

  const supabase = await createClient();
  const extensao = arquivo.name.split(".").pop() ?? "png";
  const caminho = `temas-plataforma/${temaId}/preview.${extensao}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
    upsert: true,
    contentType: arquivo.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(caminho);

  const { error: updateError } = await supabase
    .from("temas_plataforma")
    .update({ foto_preview_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", temaId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/temas");
  return undefined;
}
