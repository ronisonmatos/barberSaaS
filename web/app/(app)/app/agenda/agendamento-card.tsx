"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarStatusAgendamento } from "./actions";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusAgendamento } from "@/components/ui/status-badge";

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
    <div className="rounded-md border border-linha bg-marfim-2 p-2 text-sm">
      <p className="font-medium text-carvao">
        {hora(agendamento.inicio)}–{hora(agendamento.fim)}
      </p>
      <p className="text-carvao">{agendamento.cliente_nome}</p>
      <p className="text-cinza-600">{agendamento.servico_nome}</p>
      <StatusBadge status={agendamento.status as StatusAgendamento} />
      {editavel && (
        <div className="mt-1 flex gap-2 text-xs">
          <Button variant="ghost" disabled={pending} onClick={() => atualizar("concluido")}>
            Concluir
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => atualizar("no_show")}>
            Marcar não compareceu
          </Button>
          <Button variant="perigo" disabled={pending} onClick={() => atualizar("cancelado")}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
