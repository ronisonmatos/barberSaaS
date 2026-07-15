"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  profissional_id: z.string().uuid().optional(),
  inicio: z.string().min(1, { error: "Informe o início." }),
  fim: z.string().min(1, { error: "Informe o fim." }),
  motivo: z.string().trim().optional(),
});

export async function criarBloqueio(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    profissional_id: formData.get("profissional_id") || undefined,
    inicio: formData.get("inicio"),
    fim: formData.get("fim"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const inicio = new Date(parsed.data.inicio);
  const fim = new Date(parsed.data.fim);
  if (fim <= inicio) {
    return { error: "O fim deve ser depois do início." };
  }

  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();

  const { error } = await supabase.from("bloqueios").insert({
    barbearia_id: barbearia.id,
    profissional_id: parsed.data.profissional_id ?? null,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    motivo: parsed.data.motivo || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/bloqueios");
  return undefined;
}

export async function excluirBloqueio(id: string) {
  const supabase = await createClient();
  await supabase.from("bloqueios").delete().eq("id", id);
  revalidatePath("/app/bloqueios");
}
