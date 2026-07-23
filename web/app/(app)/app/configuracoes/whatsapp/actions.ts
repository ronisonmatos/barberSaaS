"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { enviarTemplateWhatsapp } from "@/lib/whatsapp";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  ativo: z.boolean(),
  phoneNumberId: z.string().trim().optional(),
  accessToken: z.string().trim().optional(),
  nomeTemplateLembrete: z.string().trim().min(1, { error: "Informe o nome do template." }),
  idiomaTemplate: z.string().trim().min(1, { error: "Informe o idioma do template." }),
});

export async function salvarConfigWhatsapp(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar isso." };

  const parsed = schema.safeParse({
    ativo: formData.get("ativo") === "on",
    phoneNumberId: formData.get("phoneNumberId") || undefined,
    accessToken: formData.get("accessToken") || undefined,
    nomeTemplateLembrete: formData.get("nomeTemplateLembrete"),
    idiomaTemplate: formData.get("idiomaTemplate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("estabelecimento_whatsapp_config")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();

  const { error } = await supabase.from("estabelecimento_whatsapp_config").upsert(
    {
      estabelecimento_id: estabelecimento.id,
      ativo: parsed.data.ativo,
      phone_number_id: parsed.data.phoneNumberId || atual?.phone_number_id || null,
      access_token: parsed.data.accessToken || atual?.access_token || null,
      nome_template_lembrete: parsed.data.nomeTemplateLembrete,
      idioma_template: parsed.data.idiomaTemplate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "estabelecimento_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/whatsapp");
  return undefined;
}

export type TesteFormState = { error?: string; sucesso?: string } | undefined;

const testeSchema = z.object({
  telefone: z.string().trim().min(8, { error: "Informe um telefone válido, com DDD e código do país (ex: 5511999998888)." }),
});

export async function testarEnvioWhatsapp(_prevState: TesteFormState, formData: FormData): Promise<TesteFormState> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar isso." };

  const parsed = testeSchema.safeParse({ telefone: formData.get("telefone") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Telefone inválido." };

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("estabelecimento_whatsapp_config")
    .select("phone_number_id, access_token, nome_template_lembrete, idioma_template")
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();

  if (!config?.phone_number_id || !config?.access_token) {
    return { error: "Salve o Phone number ID e o token de acesso antes de testar." };
  }

  try {
    await enviarTemplateWhatsapp({
      phoneNumberId: config.phone_number_id,
      accessToken: config.access_token,
      paraE164: parsed.data.telefone,
      nomeTemplate: config.nome_template_lembrete,
      idioma: config.idioma_template,
      parametrosCorpo: [estabelecimento.nome, "Plano de teste", new Date().toLocaleDateString("pt-BR")],
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao enviar mensagem de teste." };
  }

  return { sucesso: "Mensagem de teste enviada. Confira o WhatsApp informado." };
}
