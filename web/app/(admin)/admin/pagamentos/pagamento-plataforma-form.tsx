"use client";

import { useActionState } from "react";
import { salvarConfiguracaoPlataforma } from "./actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function PagamentoPlataformaForm({
  mercadoPagoPublicKey,
  mercadoPagoTokenMascarado,
  mercadoPagoWebhookSecretMascarado,
  asaasChaveMascarada,
  urlWebhook,
}: {
  mercadoPagoPublicKey: string;
  mercadoPagoTokenMascarado: string | null;
  mercadoPagoWebhookSecretMascarado: string | null;
  asaasChaveMascarada: string | null;
  urlWebhook: string;
}) {
  const [state, action, pending] = useActionState(salvarConfiguracaoPlataforma, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border border-linha p-4">
        <p className="text-sm font-medium">Mercado Pago</p>
        <p className="text-xs text-cinza-600">
          Usado hoje pra cobrar a assinatura de plano e a compra de templates premium (Pix e
          cartão).
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-sm">Public key</label>
          <Input name="mercadoPagoPublicKey" defaultValue={mercadoPagoPublicKey} placeholder="Colar public key" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm">
            Access token {mercadoPagoTokenMascarado ? `(atual: ${mercadoPagoTokenMascarado})` : "(não configurado)"}
          </label>
          <PasswordInput
            name="mercadoPagoAccessToken"
            placeholder={mercadoPagoTokenMascarado ? "Deixe em branco para manter" : "Colar access token"}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm">
            Webhook secret{" "}
            {mercadoPagoWebhookSecretMascarado ? `(atual: ${mercadoPagoWebhookSecretMascarado})` : "(não configurado)"}
          </label>
          <PasswordInput
            name="mercadoPagoWebhookSecret"
            placeholder={mercadoPagoWebhookSecretMascarado ? "Deixe em branco para manter" : "Colar webhook secret"}
          />
          <p className="text-xs text-cinza-600">
            No painel de desenvolvedor do Mercado Pago, cadastre esta URL como webhook de pagamentos e cole
            aqui o secret gerado lá: <span className="font-medium">{urlWebhook}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-linha p-4">
        <p className="text-sm font-medium">Asaas</p>
        <p className="text-xs text-cinza-600">
          Guardado pra quando a cobrança da plataforma via Asaas for implementada — hoje só a
          credencial fica salva, sem uso real ainda.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-sm">
            API key {asaasChaveMascarada ? `(atual: ${asaasChaveMascarada})` : "(não configurada)"}
          </label>
          <PasswordInput
            name="asaasApiKey"
            placeholder={asaasChaveMascarada ? "Deixe em branco para manter" : "Colar API key"}
          />
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
