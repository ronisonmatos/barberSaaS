"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  estabelecimentoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Informe seu nome." }),
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function solicitarAtivacaoRascunho(input: {
  estabelecimentoId: string;
  nome: string;
  email: string;
}): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("solicitar_ativacao_rascunho", {
    p_estabelecimento_id: parsed.data.estabelecimentoId,
    p_nome: parsed.data.nome,
    p_email: parsed.data.email,
  });
  if (error) return { error: error.message };

  return {};
}
