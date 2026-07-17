"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarStatusAgendamento, reembolsarAgendamento, marcarChegada } from "./actions";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { StatusBadge, type StatusAgendamento } from "@/components/ui/status-badge";

export type AgendamentoDetalhado = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  chegou_em?: string | null;
  cliente_nome: string;
  servico_nome: string;
  pagamento?: { status: string; metodo: string; valor_centavos: number } | null;
};

export function AgendamentoCard({
  agendamento,
  podeReembolsar,
}: {
  agendamento: AgendamentoDetalhado;
  podeReembolsar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reembolsoSolicitado, setReembolsoSolicitado] = useState(false);
  const [erroReembolso, setErroReembolso] = useState<string | null>(null);

  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  function atualizar(status: "concluido" | "cancelado" | "no_show") {
    startTransition(async () => {
      await atualizarStatusAgendamento(agendamento.id, status);
      router.refresh();
    });
  }

  function marcarChegou() {
    startTransition(async () => {
      await marcarChegada(agendamento.id);
      router.refresh();
    });
  }

  function reembolsar() {
    setErroReembolso(null);
    startTransition(async () => {
      const r = await reembolsarAgendamento(agendamento.id);
      if (r.error) {
        setErroReembolso(r.error);
        return;
      }
      setReembolsoSolicitado(true);
      router.refresh();
    });
  }

  const editavel = agendamento.status === "pendente" || agendamento.status === "confirmado";
  const encerrado = agendamento.status === "cancelado" || agendamento.status === "no_show";
  const pagamento = agendamento.pagamento;
  const podeSolicitarReembolso =
    podeReembolsar &&
    encerrado &&
    pagamento?.status === "pago" &&
    (pagamento.metodo === "pix" || pagamento.metodo === "cartao");

  return (
    <div className="rounded-md border border-linha bg-marfim-2 p-2 text-sm">
      <p className="font-medium text-carvao">
        {hora(agendamento.inicio)}–{hora(agendamento.fim)}
      </p>
      <p className="text-carvao">{agendamento.cliente_nome}</p>
      <p className="text-cinza-600">{agendamento.servico_nome}</p>
      <StatusBadge status={agendamento.status as StatusAgendamento} />
      {agendamento.chegou_em ? (
        <p className="mt-1 text-xs text-sucesso">
          Chegou às {hora(agendamento.chegou_em)}
        </p>
      ) : (
        editavel && (
          <Button variant="ghost" className="mt-1 text-xs" disabled={pending} onClick={marcarChegou}>
            Marcar chegada
          </Button>
        )
      )}
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
      {encerrado && pagamento?.status === "pago" && (
        <div className="mt-1 flex flex-col gap-1">
          <p className="text-xs text-cinza-600">Pago: {centavosToBRL(pagamento.valor_centavos)}</p>
          {podeSolicitarReembolso &&
            (reembolsoSolicitado ? (
              <p className="text-xs text-latao-escuro">
                Reembolso solicitado — o status muda para &quot;Estornado&quot; assim que o Mercado Pago
                confirmar.
              </p>
            ) : (
              <Button variant="perigo" className="w-fit text-xs" disabled={pending} onClick={reembolsar}>
                {pending ? "Solicitando..." : "Reembolsar"}
              </Button>
            ))}
          {erroReembolso && <FormError className="text-xs">{erroReembolso}</FormError>}
        </div>
      )}
      {encerrado && pagamento?.status === "estornado" && (
        <p className="mt-1 text-xs text-cinza-600">Reembolsado: {centavosToBRL(pagamento.valor_centavos)}</p>
      )}
    </div>
  );
}
