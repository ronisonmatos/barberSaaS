"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { brlToCentavos } from "@/lib/money";

export type FormState = { error?: string } | undefined;

const regraSchema = z.object({
  servicoId: z.string().uuid(),
  quantidadeMes: z.coerce.number().int().min(1).max(60),
});

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  preco: z.string().min(1, { error: "Informe o preço." }),
  descricao: z.string().trim().optional(),
  ativo: z.boolean(),
  regras: z
    .array(regraSchema)
    .min(1, { error: "Adicione ao menos um serviço coberto pelo plano." }),
});

export async function salvarPlanoClube(_prevState: FormState, formData: FormData): Promise<FormState> {
  let regras: unknown;
  try {
    regras = JSON.parse(String(formData.get("regras") ?? "[]"));
  } catch {
    return { error: "Regras inválidas." };
  }

  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    preco: formData.get("preco"),
    descricao: formData.get("descricao"),
    ativo: formData.get("ativo") === "on",
    regras,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") {
    return { error: "Somente o dono do estabelecimento gerencia o clube de assinatura." };
  }

  const preco_centavos = brlToCentavos(parsed.data.preco);
  if (!Number.isFinite(preco_centavos) || preco_centavos <= 0) {
    return { error: "Preço inválido." };
  }

  const supabase = await createClient();

  const payload = {
    estabelecimento_id: estabelecimento.id,
    nome: parsed.data.nome,
    preco_centavos,
    descricao: parsed.data.descricao || null,
    ativo: parsed.data.ativo,
    regras: parsed.data.regras.map((r) => ({ servico_id: r.servicoId, quantidade_mes: r.quantidadeMes })),
  };

  const { error } = parsed.data.id
    ? await supabase.from("planos_estabelecimento").update(payload).eq("id", parsed.data.id)
    : await supabase.from("planos_estabelecimento").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/assinaturas");
  revalidatePath(`/b/${estabelecimento.slug}`);
  revalidatePath(`/b/${estabelecimento.slug}/clube`);
  return undefined;
}

export async function alternarAtivoPlanoClube(id: string, ativo: boolean): Promise<{ error?: string }> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") {
    return { error: "Somente o dono do estabelecimento gerencia o clube de assinatura." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("planos_estabelecimento").update({ ativo }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/assinaturas");
  revalidatePath(`/b/${estabelecimento.slug}`);
  revalidatePath(`/b/${estabelecimento.slug}/clube`);
  return {};
}
