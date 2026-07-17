"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";
import { brlToCentavos } from "@/lib/money";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  preco: z.string().min(1, { error: "Informe o preço." }),
  maxProfissionais: z.string().optional(),
  maxUsuarios: z.string().optional(),
  whatsapp: z.boolean(),
  relatorios: z.boolean(),
});

export async function salvarPlano(_prevState: FormState, formData: FormData): Promise<FormState> {
  await getSuperAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    preco: formData.get("preco"),
    maxProfissionais: formData.get("maxProfissionais") || undefined,
    maxUsuarios: formData.get("maxUsuarios") || undefined,
    whatsapp: formData.get("whatsapp") === "on",
    relatorios: formData.get("relatorios") === "on",
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
    nome: parsed.data.nome,
    preco_centavos,
    max_profissionais: parsed.data.maxProfissionais ? Number.parseInt(parsed.data.maxProfissionais, 10) : null,
    max_usuarios: parsed.data.maxUsuarios ? Number.parseInt(parsed.data.maxUsuarios, 10) : null,
    recursos: { whatsapp: parsed.data.whatsapp, relatorios: parsed.data.relatorios },
  };

  const { error } = parsed.data.id
    ? await supabase.from("planos_plataforma").update(payload).eq("id", parsed.data.id)
    : await supabase.from("planos_plataforma").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/planos");
  return undefined;
}

export async function alternarAtivoPlano(id: string, ativo: boolean) {
  await getSuperAdmin();
  const supabase = await createClient();
  await supabase.from("planos_plataforma").update({ ativo }).eq("id", id);
  revalidatePath("/admin/planos");
}
