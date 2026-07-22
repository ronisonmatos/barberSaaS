"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

const corSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Cor inválida." });

// "atelier" é uma paleta pronta liberada pra qualquer estabelecimento (decisão explícita do
// usuário) -- só "prestigio" continua exclusiva de quem comprou o template correspondente.
const PRESETS_EXCLUSIVOS_DE_TEMPLATE = ["prestigio"];

const schema = z.object({
  tema: z.enum(["classica", "moderna", "delicada", "prestigio", "atelier", "personalizado"]),
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

  // "prestigio"/"atelier" são paletas exclusivas de quem comprou o template correspondente -- a
  // UI já esconde essas opções de quem não comprou, mas o servidor nunca confia só nisso (mesmo
  // padrão do gate em salvarTemplate).
  if (PRESETS_EXCLUSIVOS_DE_TEMPLATE.includes(parsed.data.tema)) {
    const { data: temaPlataforma } = await supabase
      .from("temas_plataforma")
      .select("id")
      .eq("chave", parsed.data.tema)
      .maybeSingle();
    const { data: comprado } = temaPlataforma
      ? await supabase
          .from("estabelecimento_temas_comprados")
          .select("id")
          .eq("estabelecimento_id", estabelecimento.id)
          .eq("tema_plataforma_id", temaPlataforma.id)
          .maybeSingle()
      : { data: null };
    if (!comprado) return { error: "Essa paleta é exclusiva de quem comprou o template correspondente." };
  }
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
