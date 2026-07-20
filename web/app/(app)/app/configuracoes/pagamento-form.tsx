"use client";

import { useActionState, useState } from "react";
import { salvarConfigPagamento } from "./actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

type Gateway = "nenhum" | "mercado_pago" | "asaas";

export function PagamentoForm({
  gatewayAtivo,
  aceitaPagamentoAntecipado,
  aceitaPagamentoNoDia,
  mercadoPagoTokenMascarado,
  mercadoPagoPublicKey,
  mercadoPagoWebhookSecretMascarado,
  asaasChaveMascarada,
  urlWebhook,
}: {
  gatewayAtivo: Gateway;
  aceitaPagamentoAntecipado: boolean;
  aceitaPagamentoNoDia: boolean;
  mercadoPagoTokenMascarado: string | null;
  mercadoPagoPublicKey: string | null;
  mercadoPagoWebhookSecretMascarado: string | null;
  asaasChaveMascarada: string | null;
  urlWebhook: string;
}) {
  const [state, action, pending] = useActionState(salvarConfigPagamento, undefined);
  const [gateway, setGateway] = useState<Gateway>(gatewayAtivo);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Como o cliente pode pagar</p>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="aceitaPagamentoAntecipado" defaultChecked={aceitaPagamentoAntecipado} />
            Pagar ao agendar (online, pelo gateway abaixo)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="aceitaPagamentoNoDia" defaultChecked={aceitaPagamentoNoDia} />
            Pagar no dia (sem cobrança no agendamento)
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Gateway ativo</p>
        <div className="flex flex-col gap-2 text-sm">
          {(
            [
              { valor: "nenhum", label: "Nenhum" },
              { valor: "mercado_pago", label: "Mercado Pago — Pix (cartão em breve)" },
              { valor: "asaas", label: "Asaas" },
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
          <label className="text-sm">Public key</label>
          <Input name="mercadoPagoPublicKey" defaultValue={mercadoPagoPublicKey ?? ""} placeholder="Colar public key" />
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
