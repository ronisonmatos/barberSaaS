"use client";

import { useActionState, useState } from "react";
import { salvarConfiguracaoPlataforma } from "./actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

type Gateway = "mercado_pago" | "asaas";

export function PagamentoPlataformaForm({
  gatewayAtivo,
  mercadoPagoPublicKey,
  mercadoPagoTokenMascarado,
  mercadoPagoWebhookSecretMascarado,
  asaasChaveMascarada,
  asaasWebhookTokenMascarado,
  urlWebhook,
  urlWebhookAsaas,
}: {
  gatewayAtivo: Gateway;
  mercadoPagoPublicKey: string;
  mercadoPagoTokenMascarado: string | null;
  mercadoPagoWebhookSecretMascarado: string | null;
  asaasChaveMascarada: string | null;
  asaasWebhookTokenMascarado: string | null;
  urlWebhook: string;
  urlWebhookAsaas: string;
}) {
  const [state, action, pending] = useActionState(salvarConfiguracaoPlataforma, undefined);
  const [gateway, setGateway] = useState<Gateway>(gatewayAtivo);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Gateway ativo</p>
        <div className="flex flex-col gap-2 text-sm">
          {(
            [
              { valor: "mercado_pago", label: "Mercado Pago" },
              { valor: "asaas", label: "Asaas (Pix e cartão parcelado via checkout hospedado)" },
            ] as const
          ).map((opcao) => (
            <label key={opcao.valor} className="flex items-center gap-2">
              <input
                type="radio"
                name="gatewayAtivo"
                value={opcao.valor}
                checked={gateway === opcao.valor}
                onChange={() => setGateway(opcao.valor)}
              />
              {opcao.label}
            </label>
          ))}
        </div>
      </div>

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
          Quando ativo, a cobrança de plano/template usa o Checkout hospedado da própria Asaas
          (Pix e cartão parcelado) — o dono é redirecionado pra lá e volta automaticamente.
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
        <div className="flex flex-col gap-1">
          <label className="text-sm">
            Webhook token{" "}
            {asaasWebhookTokenMascarado ? `(atual: ${asaasWebhookTokenMascarado})` : "(não configurado)"}
          </label>
          <PasswordInput
            name="asaasWebhookToken"
            placeholder={asaasWebhookTokenMascarado ? "Deixe em branco para manter" : "Colar webhook token"}
          />
          <p className="text-xs text-cinza-600">
            No painel de webhooks da Asaas, cadastre esta URL e cole aqui o mesmo token de autenticação
            definido lá: <span className="font-medium">{urlWebhookAsaas}</span>
          </p>
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
