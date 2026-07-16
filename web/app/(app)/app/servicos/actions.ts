"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { brlToCentavos } from "@/lib/money";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  descricao: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
  duracao_minutos: z.coerce.number().int().positive({ error: "Duração deve ser maior que zero." }),
  preco: z.string().min(1, { error: "Informe o preço." }),
});

export async function salvarServico(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria"),
    duracao_minutos: formData.get("duracao_minutos"),
    preco: formData.get("preco"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const preco_centavos = brlToCentavos(parsed.data.preco);
  if (!Number.isFinite(preco_centavos) || preco_centavos < 0) {
    return { error: "Preço inválido." };
  }

  const payload = {
    estabelecimento_id: estabelecimento.id,
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    categoria: parsed.data.categoria || null,
    duracao_minutos: parsed.data.duracao_minutos,
    preco_centavos,
  };

  const { error } = parsed.data.id
    ? await supabase.from("servicos").update(payload).eq("id", parsed.data.id)
    : await supabase.from("servicos").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/app/servicos");
  return undefined;
}

export async function alternarAtivoServico(id: string, ativo: boolean) {
  const supabase = await createClient();
  await supabase.from("servicos").update({ ativo }).eq("id", id);
  revalidatePath("/app/servicos");
}
