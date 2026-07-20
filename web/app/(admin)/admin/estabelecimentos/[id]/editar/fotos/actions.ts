"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "@/app/(app)/app/configuracoes/limites";

export type FormState = { error?: string } | undefined;

// Rascunho nao tem plano, entao nao faz sentido reusar a logica de max_fotos por plano.
const LIMITE_FOTOS_RASCUNHO = 10;

export async function adicionarFotosRascunho(_prevState: FormState, formData: FormData): Promise<FormState> {
  const estabelecimentoId = formData.get("estabelecimentoId") as string;
  await getSuperAdminERascunho(estabelecimentoId);
  const arquivos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);

  if (arquivos.length === 0) return { error: "Escolha ao menos uma imagem." };
  for (const arquivo of arquivos) {
    if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) {
      return { error: `"${arquivo.name}" não é PNG, JPEG, WEBP ou SVG.` };
    }
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      return { error: `"${arquivo.name}" é muito grande (máx. 5MB).` };
    }
  }

  const supabase = await createClient();

  const [{ count: fotosAtuais }, { count: fotosTotal }] = await Promise.all([
    supabase
      .from("estabelecimento_fotos")
      .select("id", { count: "exact", head: true })
      .eq("estabelecimento_id", estabelecimentoId)
      .eq("ativo", true),
    supabase
      .from("estabelecimento_fotos")
      .select("id", { count: "exact", head: true })
      .eq("estabelecimento_id", estabelecimentoId),
  ]);
  const usadas = fotosAtuais ?? 0;
  if (usadas >= LIMITE_FOTOS_RASCUNHO) {
    return { error: `Limite de fotos atingido (${LIMITE_FOTOS_RASCUNHO}).` };
  }
  if (arquivos.length > LIMITE_FOTOS_RASCUNHO - usadas) {
    return {
      error: `Você selecionou ${arquivos.length} fotos, mas só há espaço para mais ${LIMITE_FOTOS_RASCUNHO - usadas}.`,
    };
  }

  let ordem = fotosTotal ?? 0;
  for (const arquivo of arquivos) {
    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${estabelecimentoId}/galeria/${crypto.randomUUID()}.${extensao}`;

    const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      contentType: arquivo.type,
    });
    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(caminho);

    const { error: insertError } = await supabase.from("estabelecimento_fotos").insert({
      estabelecimento_id: estabelecimentoId,
      url: publicUrl,
      ordem: ordem++,
    });
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/editar/fotos`);
  return undefined;
}

export async function removerFotoRascunho(estabelecimentoId: string, fotoId: string): Promise<{ error?: string }> {
  await getSuperAdminERascunho(estabelecimentoId);
  const supabase = await createClient();

  const { data: foto } = await supabase
    .from("estabelecimento_fotos")
    .select("id, url")
    .eq("id", fotoId)
    .eq("estabelecimento_id", estabelecimentoId)
    .single();
  if (!foto) return { error: "Foto não encontrada." };

  const { error } = await supabase.from("estabelecimento_fotos").delete().eq("id", fotoId);
  if (error) return { error: error.message };

  const caminho = foto.url.split("/logos/")[1];
  if (caminho) await supabase.storage.from("logos").remove([caminho]);

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/editar/fotos`);
  return {};
}
