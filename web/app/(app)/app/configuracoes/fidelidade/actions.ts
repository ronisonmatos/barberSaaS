"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

export type FormState = { error?: string } | undefined;

const schema = z
  .object({
    id: z.string().uuid().optional(),
    nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
    servicoId: z.string().uuid({ error: "Selecione o serviço que conta selos." }),
    selosNecessarios: z.coerce
      .number()
      .int()
      .min(2, { error: "Mínimo de 2 selos." })
      .max(50, { error: "Máximo de 50 selos." }),
    brindeTipo: z.enum(["servico", "produto"]),
    brindeServicoId: z.string().uuid().optional(),
    brindeProdutoId: z.string().uuid().optional(),
    ativo: z.boolean(),
  })
  .refine(
    (data) =>
      data.brindeTipo === "servico" ? Boolean(data.brindeServicoId) : Boolean(data.brindeProdutoId),
    { error: "Selecione o brinde do programa.", path: ["brindeServicoId"] }
  );

export async function salvarProgramaFidelidade(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    servicoId: formData.get("servicoId"),
    selosNecessarios: formData.get("selosNecessarios"),
    brindeTipo: formData.get("brindeTipo"),
    brindeServicoId: formData.get("brindeServicoId") || undefined,
    brindeProdutoId: formData.get("brindeProdutoId") || undefined,
    ativo: formData.get("ativo") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") {
    return { error: "Somente o dono do estabelecimento gerencia programas de fidelidade." };
  }

  const supabase = await createClient();

  const payload = {
    estabelecimento_id: estabelecimento.id,
    nome: parsed.data.nome,
    servico_id: parsed.data.servicoId,
    selos_necessarios: parsed.data.selosNecessarios,
    brinde_tipo: parsed.data.brindeTipo,
    brinde_servico_id: parsed.data.brindeTipo === "servico" ? parsed.data.brindeServicoId : null,
    brinde_produto_id: parsed.data.brindeTipo === "produto" ? parsed.data.brindeProdutoId : null,
    ativo: parsed.data.ativo,
  };

  const { error } = parsed.data.id
    ? await supabase.from("programas_fidelidade").update(payload).eq("id", parsed.data.id)
    : await supabase.from("programas_fidelidade").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/fidelidade");
  revalidatePath("/app/fidelidade");
  return undefined;
}

export async function alternarAtivoPrograma(id: string, ativo: boolean): Promise<{ error?: string }> {
  const { papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") {
    return { error: "Somente o dono do estabelecimento gerencia programas de fidelidade." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("programas_fidelidade").update({ ativo }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/fidelidade");
  revalidatePath("/app/fidelidade");
  return {};
}
