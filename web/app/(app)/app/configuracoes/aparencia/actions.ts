"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

const corSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Cor inválida." });

const schema = z.object({
  tema: z.enum(["classica", "moderna", "delicada", "personalizado"]),
  bg: corSchema,
  bg2: corSchema,
  fg: corSchema,
  linha: corSchema,
  acento: corSchema,
  acentoFg: corSchema,
});

export async function salvarAparencia(input: z.infer<typeof schema>): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar a aparência." };

  const supabase = await createClient();
  const configAtual = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const { error } = await supabase
    .from("estabelecimentos")
    .update({
      config: {
        ...configAtual,
        tema: parsed.data.tema,
        cores: {
          bg: parsed.data.bg,
          bg2: parsed.data.bg2,
          fg: parsed.data.fg,
          linha: parsed.data.linha,
          acento: parsed.data.acento,
          acentoFg: parsed.data.acentoFg,
        },
      },
    })
    .eq("id", estabelecimento.id);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/aparencia");
  revalidatePath(`/b/${estabelecimento.slug}`);
  return {};
}
