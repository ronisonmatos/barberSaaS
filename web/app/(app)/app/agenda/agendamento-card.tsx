"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarStatusAgendamento } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "Não compareceu",
};

export type AgendamentoDetalhado = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  cliente_nome: string;
  servico_nome: string;
};

export function AgendamentoCard({ agendamento }: { agendamento: AgendamentoDetalhado }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  function atualizar(status: "concluido" | "cancelado" | "no_show") {
    startTransition(async () => {
      await atualizarStatusAgendamento(agendamento.id, status);
      router.refresh();
    });
  }

  const editavel = agendamento.status === "pendente" || agendamento.status === "confirmado";

  return (
    <div className="rounded-md border border-neutral-200 p-2 text-sm dark:border-neutral-800">
      <p className="font-medium">
        {hora(agendamento.inicio)}–{hora(agendamento.fim)}
      </p>
      <p>{agendamento.cliente_nome}</p>
      <p className="text-neutral-500">{agendamento.servico_nome}</p>
      <p className="text-xs text-neutral-500">{STATUS_LABEL[agendamento.status]}</p>
      {editavel && (
        <div className="mt-1 flex gap-2 text-xs">
          <button disabled={pending} className="underline" onClick={() => atualizar("concluido")}>
            Concluir
          </button>
          <button disabled={pending} className="underline" onClick={() => atualizar("no_show")}>
            No-show
          </button>
          <button disabled={pending} className="text-red-600 underline" onClick={() => atualizar("cancelado")}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
