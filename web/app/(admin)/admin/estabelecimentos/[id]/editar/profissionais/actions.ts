"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "@/app/(app)/app/configuracoes/limites";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  id: z.string().uuid().optional(),
  estabelecimentoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
});

const jornadaSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function salvarProfissionalRascunho(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    estabelecimentoId: formData.get("estabelecimentoId"),
    nome: formData.get("nome"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let jornadas: z.infer<typeof jornadaSchema>[];
  let servicoIds: string[];
  try {
    jornadas = z.array(jornadaSchema).parse(JSON.parse(String(formData.get("jornadas") || "[]")));
    servicoIds = z.array(z.string().uuid()).parse(JSON.parse(String(formData.get("servico_ids") || "[]")));
  } catch {
    return { error: "Dados de jornada ou serviços inválidos." };
  }
  if (jornadas.some((j) => j.hora_fim <= j.hora_inicio)) {
    return { error: "Em cada intervalo de jornada, o fim deve ser depois do início." };
  }

  await getSuperAdminERascunho(parsed.data.estabelecimentoId);
  const supabase = await createClient();

  const payload = {
    estabelecimento_id: parsed.data.estabelecimentoId,
    nome: parsed.data.nome,
  };

  let profissionalId = parsed.data.id;
  if (profissionalId) {
    const { error } = await supabase.from("profissionais").update(payload).eq("id", profissionalId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from("profissionais").insert(payload).select("id").single();
    if (error) return { error: error.message };
    profissionalId = data.id;
  }

  const { error: delJornadasError } = await supabase.from("jornadas").delete().eq("profissional_id", profissionalId);
  if (delJornadasError) return { error: delJornadasError.message };

  if (jornadas.length > 0) {
    const { error } = await supabase.from("jornadas").insert(
      jornadas.map((j) => ({
        estabelecimento_id: parsed.data.estabelecimentoId,
        profissional_id: profissionalId,
        dia_semana: j.dia_semana,
        hora_inicio: j.hora_inicio,
        hora_fim: j.hora_fim,
      }))
    );
    if (error) return { error: error.message };
  }

  const { error: delServicosError } = await supabase
    .from("profissional_servicos")
    .delete()
    .eq("profissional_id", profissionalId);
  if (delServicosError) return { error: delServicosError.message };

  if (servicoIds.length > 0) {
    const { error } = await supabase
      .from("profissional_servicos")
      .insert(servicoIds.map((servico_id) => ({ profissional_id: profissionalId, servico_id })));
    if (error) return { error: error.message };
  }

  revalidatePath(`/admin/estabelecimentos/${parsed.data.estabelecimentoId}/editar/profissionais`);
  revalidatePath(`/admin/estabelecimentos/${parsed.data.estabelecimentoId}/editar/servicos`);
  return undefined;
}

export async function alternarAtivoProfissionalRascunho(estabelecimentoId: string, id: string, ativo: boolean) {
  await getSuperAdminERascunho(estabelecimentoId);
  const supabase = await createClient();
  await supabase.from("profissionais").update({ ativo }).eq("id", id).eq("estabelecimento_id", estabelecimentoId);
  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/editar/profissionais`);
}

export async function enviarFotoProfissionalRascunho(
  estabelecimentoId: string,
  profissionalId: string,
  formData: FormData
): Promise<{ error?: string; fotoUrl?: string }> {
  await getSuperAdminERascunho(estabelecimentoId);
  const arquivo = formData.get("foto");

  if (!(arquivo instanceof File) || arquivo.size === 0) return { error: "Escolha uma imagem." };
  if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) return { error: "Use PNG, JPEG, WEBP ou SVG." };
  if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) return { error: "Imagem muito grande (máx. 5MB)." };

  const supabase = await createClient();
  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("id", profissionalId)
    .eq("estabelecimento_id", estabelecimentoId)
    .maybeSingle();
  if (!profissional) return { error: "Profissional não encontrado." };

  const extensao = arquivo.name.split(".").pop() ?? "png";
  const caminho = `${estabelecimentoId}/profissionais/${profissionalId}.${extensao}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
    upsert: true,
    contentType: arquivo.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(caminho);

  const novaFotoUrl = `${publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await supabase
    .from("profissionais")
    .update({ foto_url: novaFotoUrl })
    .eq("id", profissionalId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/editar/profissionais`);
  return { fotoUrl: novaFotoUrl };
}
