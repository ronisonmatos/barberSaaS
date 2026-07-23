"use client";

import { Fragment, useActionState, useState } from "react";
import Link from "next/link";
import { salvarConfigWhatsapp, testarEnvioWhatsapp } from "./actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function WhatsappForm({
  ativo,
  phoneNumberId,
  accessTokenMascarado,
  nomeTemplateLembrete,
  idiomaTemplate,
  configurado,
}: {
  ativo: boolean;
  phoneNumberId: string | null;
  accessTokenMascarado: string | null;
  nomeTemplateLembrete: string;
  idiomaTemplate: string;
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(salvarConfigWhatsapp, undefined);
  const [ligado, setLigado] = useState(ativo);
  const [testeState, testeAction, testePending] = useActionState(testarEnvioWhatsapp, undefined);

  return (
    <Fragment>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="ativo" checked={ligado} onChange={(e) => setLigado(e.target.checked)} />
          Enviar avisos também por WhatsApp
        </label>

        <details className="rounded-md bg-marfim-2 p-3 text-sm text-cinza-600">
          <summary className="cursor-pointer font-medium text-carvao">
            Não sei onde encontrar essas informações — como faço?
          </summary>
          <ol className="mt-2 list-decimal space-y-2 pl-4">
            <li>
              Tenha uma conta no{" "}
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="text-latao-escuro underline"
              >
                Meta Business Manager
              </a>{" "}
              e crie (ou use) um app em{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="text-latao-escuro underline"
              >
                Meta for Developers
              </a>{" "}
              com o produto <strong>WhatsApp</strong> adicionado.
            </li>
            <li>
              Dentro do app, abra <strong>WhatsApp → Configuração da API</strong>. Existem dois
              números lá: um <strong>de teste</strong> (grátis, mas só envia pra destinatários
              cadastrados e só usa o template pronto <code>hello_world</code>) e, quando estiver
              pronto pra valer, um <strong>número de produção</strong> — que precisa ser exclusivo
              pra API (não pode estar em uso no WhatsApp comum) e do seu próprio template aprovado.
              Copie o <strong>Phone number ID</strong> e um <strong>token de acesso</strong> (com as
              permissões <code>whatsapp_business_management</code> e{" "}
              <code>whatsapp_business_messaging</code>) nos campos abaixo.
            </li>
            <li>
              Em <strong>WhatsApp → Modelos de mensagem</strong>, crie um template pra esse aviso de
              renovação (com variáveis pro nome do estabelecimento, nome do plano e data de vencimento,
              nessa ordem) e aguarde a aprovação da Meta — pode levar algumas horas. Copie o{" "}
              <strong>nome exato</strong> do template no campo abaixo.
            </li>
          </ol>
          <p className="mt-2 text-xs text-cinza-300">
            Sem um template aprovado, o envio por WhatsApp falha silenciosamente (o aviso por e-mail
            continua funcionando normalmente).
          </p>
          <Link
            href="/app/configuracoes/whatsapp/ajuda"
            className="mt-3 inline-block text-sm font-medium text-latao-escuro underline"
          >
            Ver guia completo, com os erros mais comuns →
          </Link>
        </details>

        <div className="flex flex-col gap-1">
          <label className="text-sm">Phone number ID</label>
          <Input name="phoneNumberId" defaultValue={phoneNumberId ?? ""} placeholder="Ex: 123456789012345" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">
            Token de acesso {accessTokenMascarado ? `(atual: ${accessTokenMascarado})` : "(não configurado)"}
          </label>
          <PasswordInput
            name="accessToken"
            placeholder={accessTokenMascarado ? "Deixe em branco para manter" : "Colar token de acesso"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">Nome do template de renovação</label>
          <Input name="nomeTemplateLembrete" defaultValue={nomeTemplateLembrete} placeholder="lembrete_renovacao" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm">Idioma do template</label>
          <Input name="idiomaTemplate" defaultValue={idiomaTemplate} placeholder="pt_BR" />
        </div>

        {state?.error && <FormError>{state.error}</FormError>}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Salvando..." : "Salvar"}
        </Button>

        {configurado && (
          <div className="mt-2 flex flex-col gap-2 border-t border-cinza-100 pt-4">
            <p className="text-sm font-medium text-carvao">Testar envio</p>
            <p className="text-xs text-cinza-300">
              Envia o template &quot;{nomeTemplateLembrete}&quot; salvo pra um número de verdade, com dados
              de exemplo. Confirma se o Phone number ID, o token e o template aprovado estão funcionando
              juntos.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="helloWorld" form="teste-whatsapp" />
              Testar com o modelo de exemplo &quot;hello_world&quot; (já vem aprovado pela Meta, sem
              variáveis — use se o seu template ainda não foi aprovado)
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm">Número pra teste (com DDI e DDD)</label>
                <Input name="telefone" form="teste-whatsapp" placeholder="Ex: 5511999998888" />
              </div>
              <Button type="submit" form="teste-whatsapp" disabled={testePending} variant="secondary">
                {testePending ? "Enviando..." : "Enviar teste"}
              </Button>
            </div>
            {testeState?.error && <FormError>{testeState.error}</FormError>}
            {testeState?.sucesso && <p className="text-sm text-sucesso">{testeState.sucesso}</p>}
          </div>
        )}
      </form>
      <form id="teste-whatsapp" action={testeAction} className="hidden" />
    </Fragment>
  );
}
