"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { FormError } from "./ui/form-error";

export type MensagemTicket = {
  id: string;
  autorNome: string;
  mensagem: string;
  criadoEm: string;
};

type EnviarMensagemState = { error?: string } | undefined;

export function TicketThread({
  mensagens,
  enviarMensagem,
  statusAtual,
  statusLabel,
  opcoesStatus,
  onAlterarStatus,
}: {
  mensagens: MensagemTicket[];
  enviarMensagem: (prevState: EnviarMensagemState, formData: FormData) => Promise<EnviarMensagemState>;
  statusAtual: string;
  statusLabel: string;
  opcoesStatus: { valor: string; label: string }[];
  onAlterarStatus: (novoStatus: string) => Promise<void>;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(enviarMensagem, undefined);
  const [statusPending, startStatusTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-carvao">Status: {statusLabel}</span>
        <div className="flex gap-2">
          {opcoesStatus.map((opcao) => (
            <button
              key={opcao.valor}
              disabled={statusPending || opcao.valor === statusAtual}
              onClick={() =>
                startStatusTransition(async () => {
                  await onAlterarStatus(opcao.valor);
                  router.refresh();
                })
              }
              className="text-sm text-cinza-600 underline hover:text-carvao disabled:opacity-40 disabled:no-underline"
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {mensagens.map((m) => (
          <div key={m.id} className="rounded-md border border-linha bg-marfim-2 p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-carvao">{m.autorNome}</span>
              <span className="text-xs text-cinza-600">
                {new Date(m.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-carvao">{m.mensagem}</p>
          </div>
        ))}
        {mensagens.length === 0 && <p className="text-sm text-cinza-600">Nenhuma mensagem ainda.</p>}
      </div>

      <form action={action} className="flex flex-col gap-2">
        <textarea
          name="mensagem"
          required
          rows={3}
          placeholder="Escrever uma resposta..."
          className="rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
        />
        {state?.error && <FormError>{state.error}</FormError>}
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
