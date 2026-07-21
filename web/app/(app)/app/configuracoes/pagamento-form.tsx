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
  asaasWebhookTokenMascarado,
  urlWebhook,
  urlWebhookAsaas,
}: {
  gatewayAtivo: Gateway;
  aceitaPagamentoAntecipado: boolean;
  aceitaPagamentoNoDia: boolean;
  mercadoPagoTokenMascarado: string | null;
  mercadoPagoPublicKey: string | null;
  mercadoPagoWebhookSecretMascarado: string | null;
  asaasChaveMascarada: string | null;
  asaasWebhookTokenMascarado: string | null;
  urlWebhook: string;
  urlWebhookAsaas: string;
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

        <details className="rounded-md bg-marfim-2 p-3 text-sm text-cinza-600">
          <summary className="cursor-pointer font-medium text-carvao">
            Não sei onde encontrar essas informações — como faço?
          </summary>
          <ol className="mt-2 list-decimal space-y-2 pl-4">
            <li>
              Tenha uma conta no{" "}
              <a
                href="https://www.mercadopago.com.br"
                target="_blank"
                rel="noreferrer"
                className="text-latao-escuro underline"
              >
                Mercado Pago
              </a>{" "}
              (a mesma que você usa pra vender, com CPF ou CNPJ).
            </li>
            <li>
              Acesse o{" "}
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                target="_blank"
                rel="noreferrer"
                className="text-latao-escuro underline"
              >
                Painel do Desenvolvedor
              </a>{" "}
              (entre com a mesma conta) e crie uma aplicação — pode dar qualquer nome, ex: &quot;Meu
              site&quot;.
            </li>
            <li>
              Dentro da aplicação, abra a aba <strong>&quot;Credenciais de produção&quot;</strong>. Lá estão a{" "}
              <strong>Public Key</strong> e o <strong>Access Token</strong> — copie e cole cada um no campo
              correspondente abaixo.
            </li>
            <li>
              Ainda na mesma aplicação, abra a aba <strong>&quot;Webhooks&quot;</strong>, clique em
              configurar notificações e cole a URL abaixo no campo de endereço. O Mercado Pago vai gerar uma{" "}
              <strong>&quot;Chave secreta&quot;</strong> — copie e cole no campo &quot;Webhook secret&quot;
              abaixo.
            </li>
          </ol>
          <p className="mt-2 text-xs text-cinza-300">
            Essas são as credenciais de <strong>produção</strong> (não as de teste/sandbox) — são elas que
            fazem o dinheiro cair de verdade na sua conta.
          </p>
        </details>

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

        <details className="rounded-md bg-marfim-2 p-3 text-sm text-cinza-600">
          <summary className="cursor-pointer font-medium text-carvao">
            Não sei onde encontrar essa informação — como faço?
          </summary>
          <ol className="mt-2 list-decimal space-y-2 pl-4">
            <li>
              Tenha uma conta no{" "}
              <a href="https://www.asaas.com" target="_blank" rel="noreferrer" className="text-latao-escuro underline">
                Asaas
              </a>
              .
            </li>
            <li>
              Depois de entrar, procure no menu por <strong>&quot;Integrações&quot;</strong> (às vezes aparece
              como um ícone de engrenagem ou &quot;Configurações da conta&quot;).
            </li>
            <li>
              Dentro de Integrações, abra <strong>&quot;Chave de API&quot;</strong> (ou &quot;API Key&quot;) —
              copie a chave mostrada ali e cole no campo abaixo.
            </li>
            <li>
              Ainda em Integrações, abra <strong>&quot;Webhooks&quot;</strong>, crie um novo apontando pra URL
              abaixo e defina um <strong>&quot;Token de autenticação&quot;</strong> (qualquer valor forte) —
              cole o mesmo valor no campo &quot;Webhook token&quot; abaixo.
            </li>
            <li>
              <strong>Importante:</strong> cadastre uma <strong>chave Pix</strong> na sua conta Asaas (menu
              &quot;Minha conta&quot; → &quot;Chaves Pix&quot;) antes de usar. Sem isso, o Pix ainda funciona,
              mas usa uma chave temporária de outra instituição e pode demorar mais pra gerar o QR code.
            </li>
          </ol>
          <p className="mt-2 text-xs text-cinza-300">
            Tanto a chave de produção quanto a de testes (&quot;sandbox&quot;, começando com{" "}
            <code>$aact_hmlg_</code>) funcionam — o ambiente é identificado automaticamente pelo prefixo da
            chave.
          </p>
        </details>

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
