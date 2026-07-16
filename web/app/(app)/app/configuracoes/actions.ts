"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

export type FormState = { error?: string } | undefined;

const schemaPerfil = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
});

export async function salvarPerfil(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const parsed = schemaPerfil.safeParse({ nome: formData.get("nome") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("estabelecimentos")
    .update({ nome: parsed.data.nome })
    .eq("id", estabelecimento.id);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes");
  revalidatePath("/app");
  return undefined;
}

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const TAMANHO_MAX_BYTES = 2 * 1024 * 1024;

export async function atualizarLogo(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const arquivo = formData.get("logo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Escolha uma imagem." };
  }
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return { error: "Use PNG, JPEG, WEBP ou SVG." };
  }
  if (arquivo.size > TAMANHO_MAX_BYTES) {
    return { error: "Imagem muito grande (máx. 2MB)." };
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

  revalidatePath("/app/configuracoes");
  return undefined;
}

const schemaPagamento = z
  .object({
    gatewayAtivo: z.enum(["nenhum", "mercado_pago", "asaas"]),
    aceitaPagamentoAntecipado: z.boolean(),
    aceitaPagamentoNoDia: z.boolean(),
    mercadoPagoAccessToken: z.string().trim().optional(),
    mercadoPagoPublicKey: z.string().trim().optional(),
    mercadoPagoWebhookSecret: z.string().trim().optional(),
    asaasApiKey: z.string().trim().optional(),
  })
  .refine((v) => v.aceitaPagamentoAntecipado || v.aceitaPagamentoNoDia, {
    error: "Marque ao menos uma forma de pagamento.",
  });

export async function salvarConfigPagamento(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar isso." };

  const parsed = schemaPagamento.safeParse({
    gatewayAtivo: formData.get("gatewayAtivo"),
    aceitaPagamentoAntecipado: formData.get("aceitaPagamentoAntecipado") === "on",
    aceitaPagamentoNoDia: formData.get("aceitaPagamentoNoDia") === "on",
    mercadoPagoAccessToken: formData.get("mercadoPagoAccessToken") || undefined,
    mercadoPagoPublicKey: formData.get("mercadoPagoPublicKey") || undefined,
    mercadoPagoWebhookSecret: formData.get("mercadoPagoWebhookSecret") || undefined,
    asaasApiKey: formData.get("asaasApiKey") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("estabelecimento_pagamento_config")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();

  const { error } = await supabase.from("estabelecimento_pagamento_config").upsert(
    {
      estabelecimento_id: estabelecimento.id,
      gateway_ativo: parsed.data.gatewayAtivo,
      aceita_pagamento_antecipado: parsed.data.aceitaPagamentoAntecipado,
      aceita_pagamento_no_dia: parsed.data.aceitaPagamentoNoDia,
      mercado_pago_access_token: parsed.data.mercadoPagoAccessToken || atual?.mercado_pago_access_token || null,
      mercado_pago_public_key: parsed.data.mercadoPagoPublicKey || atual?.mercado_pago_public_key || null,
      mercado_pago_webhook_secret:
        parsed.data.mercadoPagoWebhookSecret || atual?.mercado_pago_webhook_secret || null,
      asaas_api_key: parsed.data.asaasApiKey || atual?.asaas_api_key || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "estabelecimento_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes");
  return undefined;
}
