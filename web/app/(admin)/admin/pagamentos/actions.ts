"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";

export type FormState = { error?: string } | undefined;

const ID_SINGLETON = "00000000-0000-0000-0000-000000000001";

const schema = z.object({
  gatewayAtivo: z.enum(["mercado_pago", "asaas"]),
  mercadoPagoPublicKey: z.string().trim().optional(),
  mercadoPagoAccessToken: z.string().trim().optional(),
  mercadoPagoWebhookSecret: z.string().trim().optional(),
  asaasApiKey: z.string().trim().optional(),
  asaasWebhookToken: z.string().trim().optional(),
});

export async function salvarConfiguracaoPlataforma(_prevState: FormState, formData: FormData): Promise<FormState> {
  await getSuperAdmin();

  const parsed = schema.safeParse({
    gatewayAtivo: formData.get("gatewayAtivo"),
    mercadoPagoPublicKey: formData.get("mercadoPagoPublicKey") || undefined,
    mercadoPagoAccessToken: formData.get("mercadoPagoAccessToken") || undefined,
    mercadoPagoWebhookSecret: formData.get("mercadoPagoWebhookSecret") || undefined,
    asaasApiKey: formData.get("asaasApiKey") || undefined,
    asaasWebhookToken: formData.get("asaasWebhookToken") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("configuracao_plataforma")
    .select("*")
    .eq("id", ID_SINGLETON)
    .maybeSingle();

  const { error } = await supabase
    .from("configuracao_plataforma")
    .update({
      gateway_ativo: parsed.data.gatewayAtivo,
      // Public key nao e sensivel: se o campo vier vazio, o valor atual e apagado de proposito
      // (diferente das credenciais abaixo, que preservam o valor salvo quando vem em branco).
      mercado_pago_public_key: parsed.data.mercadoPagoPublicKey || null,
      mercado_pago_access_token: parsed.data.mercadoPagoAccessToken || atual?.mercado_pago_access_token || null,
      mercado_pago_webhook_secret:
        parsed.data.mercadoPagoWebhookSecret || atual?.mercado_pago_webhook_secret || null,
      asaas_api_key: parsed.data.asaasApiKey || atual?.asaas_api_key || null,
      asaas_webhook_token: parsed.data.asaasWebhookToken || atual?.asaas_webhook_token || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ID_SINGLETON);
  if (error) return { error: error.message };

  revalidatePath("/admin/pagamentos");
  return undefined;
}
