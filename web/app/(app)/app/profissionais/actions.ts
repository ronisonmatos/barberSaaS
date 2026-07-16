"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

export type FormState = { error?: string } | undefined;

const baseSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  comissao_percentual: z.coerce.number().min(0).max(100),
  ativo: z.boolean(),
});

const jornadaSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function salvarProfissional(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = baseSchema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    comissao_percentual: formData.get("comissao_percentual"),
    ativo: formData.get("ativo") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let jornadas: z.infer<typeof jornadaSchema>[];
  let servicoIds: string[];
  try {
    jornadas = z.array(jornadaSchema).parse(JSON.parse(String(formData.get("jornadas") || "[]")));
    servicoIds = z
      .array(z.string().uuid())
      .parse(JSON.parse(String(formData.get("servico_ids") || "[]")));
  } catch {
    return { error: "Dados de jornada ou serviços inválidos." };
  }
  if (jornadas.some((j) => j.hora_fim <= j.hora_inicio)) {
    return { error: "Em cada intervalo de jornada, o fim deve ser depois do início." };
  }

  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const payload = {
    estabelecimento_id: estabelecimento.id,
    nome: parsed.data.nome,
    comissao_percentual: parsed.data.comissao_percentual,
    ativo: parsed.data.ativo,
  };

  let profissionalId = parsed.data.id;
  if (profissionalId) {
    const { error } = await supabase.from("profissionais").update(payload).eq("id", profissionalId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("profissionais")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };
    profissionalId = data.id;
  }

  const { error: delJornadasError } = await supabase
    .from("jornadas")
    .delete()
    .eq("profissional_id", profissionalId);
  if (delJornadasError) return { error: delJornadasError.message };

  if (jornadas.length > 0) {
    const { error } = await supabase.from("jornadas").insert(
      jornadas.map((j) => ({
        estabelecimento_id: estabelecimento.id,
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
    const { error } = await supabase.from("profissional_servicos").insert(
      servicoIds.map((servico_id) => ({ profissional_id: profissionalId, servico_id }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/app/profissionais");
  return undefined;
}

export async function alternarAtivoProfissional(id: string, ativo: boolean) {
  const supabase = await createClient();
  await supabase.from("profissionais").update({ ativo }).eq("id", id);
  revalidatePath("/app/profissionais");
}
