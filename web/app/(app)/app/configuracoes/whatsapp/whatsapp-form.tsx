"use client";

import { useActionState, useState } from "react";
import { salvarConfigWhatsapp } from "./actions";
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
}: {
  ativo: boolean;
  phoneNumberId: string | null;
  accessTokenMascarado: string | null;
  nomeTemplateLembrete: string;
  idiomaTemplate: string;
}) {
  const [state, action, pending] = useActionState(salvarConfigWhatsapp, undefined);
  const [ligado, setLigado] = useState(ativo);

  return (
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
            Dentro do app, abra <strong>WhatsApp → Configuração da API</strong>. Lá está o{" "}
            <strong>Phone number ID</strong> e um <strong>token de acesso</strong> — copie os dois nos
            campos abaixo (o token temporário expira em 24h; pra produção, gere um token permanente
            vinculado a um usuário do sistema).
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
    </form>
  );
}
