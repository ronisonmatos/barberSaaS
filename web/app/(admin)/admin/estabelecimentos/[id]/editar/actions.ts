"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "@/app/(app)/app/configuracoes/limites";

export type FormState = { error?: string } | undefined;

const LAYOUTS_GRATIS = ["classico"];

const corSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Cor inválida." });

const schema = z.object({
  estabelecimentoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use apenas letras minúsculas, números e hífen." })
    .min(3, { error: "O endereço deve ter ao menos 3 caracteres." }),
  tema: z.enum(["classica", "moderna", "delicada", "personalizado"]),
  layout: z.string().min(1),
  bg: corSchema,
  bg2: corSchema,
  fg: corSchema,
  linha: corSchema,
  acento: corSchema,
  acentoFg: corSchema,
});

export async function salvarIdentidadeRascunho(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    estabelecimentoId: formData.get("estabelecimentoId"),
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    tema: formData.get("tema"),
    layout: formData.get("layout"),
    bg: formData.get("bg"),
    bg2: formData.get("bg2"),
    fg: formData.get("fg"),
    linha: formData.get("linha"),
    acento: formData.get("acento"),
    acentoFg: formData.get("acentoFg"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { estabelecimento } = await getSuperAdminERascunho(parsed.data.estabelecimentoId);
  const supabase = await createClient();

  // Defesa em profundidade: rascunho não tem dono nem pagamento, então só aceita "classico" ou um
  // template marcado gratis=true (mesmo padrão de LAYOUTS_GRATIS em configuracoes/template/actions.ts,
  // sem a parte de "comprado" que não se aplica aqui).
  if (!LAYOUTS_GRATIS.includes(parsed.data.layout)) {
    const { data: tema } = await supabase
      .from("temas_plataforma")
      .select("id")
      .eq("chave", parsed.data.layout)
      .eq("ativo", true)
      .eq("gratis", true)
      .maybeSingle();
    if (!tema) return { error: "Template inválido ou não é mais gratuito." };
  }

  const configAtual = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const { error } = await supabase
    .from("estabelecimentos")
    .update({
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      config: {
        ...configAtual,
        tema: parsed.data.tema,
        layout: parsed.data.layout,
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
    .eq("id", parsed.data.estabelecimentoId);

  if (error) {
    if (error.message.includes("estabelecimentos_slug_key")) {
      return { error: "Esse endereço já está em uso, escolha outro." };
    }
    return { error: error.message };
  }

  revalidatePath(`/admin/estabelecimentos/${parsed.data.estabelecimentoId}/editar`);
  revalidatePath(`/b/${parsed.data.slug}`);
  return undefined;
}

export async function enviarLogoRascunho(_prevState: FormState, formData: FormData): Promise<FormState> {
  const estabelecimentoId = formData.get("estabelecimentoId") as string;
  const { estabelecimento } = await getSuperAdminERascunho(estabelecimentoId);
  const arquivo = formData.get("logo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Escolha uma imagem." };
  }
  if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) {
    return { error: "Use PNG, JPEG, WEBP ou SVG." };
  }
  if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
    return { error: "Imagem muito grande (máx. 5MB)." };
  }

  const supabase = await createClient();
  const extensao = arquivo.name.split(".").pop() ?? "png";
  const caminho = `${estabelecimento.id}/logo.${extensao}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
    upsert: true,
    contentType: arquivo.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(caminho);

  const { error: updateError } = await supabase
    .from("estabelecimentos")
    .update({ logo_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", estabelecimento.id);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/editar`);
  revalidatePath(`/b/${estabelecimento.slug}`);
  return undefined;
}
