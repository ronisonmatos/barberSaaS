"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { normalizePhoneBR } from "@/lib/phone";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  telefone: z.string().min(1, { error: "Informe o telefone." }),
  email: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

export async function salvarCliente(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    observacoes: formData.get("observacoes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "Telefone inválido. Use um número de celular brasileiro com DDD." };
  }

  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();

  const payload = {
    barbearia_id: barbearia.id,
    nome: parsed.data.nome,
    telefone,
    email: parsed.data.email || null,
    observacoes: parsed.data.observacoes || null,
  };

  const { error } = parsed.data.id
    ? await supabase.from("clientes").update(payload).eq("id", parsed.data.id)
    : await supabase.from("clientes").insert(payload);

  if (error) {
    if (error.message.includes("clientes_barbearia_id_telefone_key")) {
      return { error: "Já existe um cliente com esse telefone." };
    }
    return { error: error.message };
  }

  revalidatePath("/app/clientes");
  return undefined;
}
