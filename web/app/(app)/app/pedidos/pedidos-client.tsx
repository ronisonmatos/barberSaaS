"use client";

import { useState, useTransition } from "react";
import { Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Clock, CheckCheck, Check, X } from "lucide-react";
import { marcarPedidoRetirado, cancelarPedido } from "./actions";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";

type Pedido = {
  id: string;
  status: "pendente" | "aguardando_retirada" | "retirado" | "cancelado";
  totalCentavos: number;
  createdAt: string;
  combinadoComAgendamento: boolean;
  clienteNome: string;
  clienteTelefone: string;
  itens: { nome_produto: string; quantidade: number; preco_unitario_centavos: number }[];
};

const STATUS_CONFIG: Record<Pedido["status"], { label: string; icon: LucideIcon; className: string }> = {
  pendente: { label: "Aguardando pagamento", icon: Clock, className: "text-aviso" },
  aguardando_retirada: { label: "Aguardando retirada", icon: Check, className: "text-latao-escuro" },
  retirado: { label: "Retirado", icon: CheckCheck, className: "text-sucesso" },
  cancelado: { label: "Cancelado", icon: X, className: "text-cinza-600" },
};

export function PedidosClient({ pedidos }: { pedidos: Pedido[] }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [emAcao, setEmAcao] = useState<string | null>(null);

  function retirar(id: string) {
    setErro(null);
    setEmAcao(id);
    startTransition(async () => {
      const r = await marcarPedidoRetirado(id);
      if (r.error) setErro(r.error);
      setEmAcao(null);
    });
  }

  function cancelar(id: string) {
    setErro(null);
    setEmAcao(id);
    startTransition(async () => {
      const r = await cancelarPedido(id);
      if (r.error) setErro(r.error);
      setEmAcao(null);
    });
  }

  if (pedidos.length === 0) {
    return (
      <EmptyState
        icon={Package}
        titulo="Nenhum pedido ainda"
        descricao="Pedidos de produtos feitos na página pública aparecem aqui."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && <FormError>{erro}</FormError>}
      {pedidos.map((p) => {
        const { label, icon: Icon, className } = STATUS_CONFIG[p.status];
        return (
          <div key={p.id} className="flex flex-col gap-2 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-carvao">{p.clienteNome}</p>
                <p className="text-xs text-cinza-600">
                  {p.clienteTelefone}
                  {p.combinadoComAgendamento ? " · combinado com agendamento" : ""}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 font-medium ${className}`}>
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {label}
              </span>
            </div>

            <ul className="flex flex-col gap-0.5 text-cinza-600">
              {p.itens.map((item, i) => (
                <li key={i}>
                  {item.quantidade}x {item.nome_produto} · {centavosToBRL(item.preco_unitario_centavos * item.quantidade)}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              <p className="font-medium tabular-nums text-carvao">Total: {centavosToBRL(p.totalCentavos)}</p>
              {p.status === "aguardando_retirada" && (
                <div className="flex gap-2">
                  <Button variant="perigo" disabled={isPending && emAcao === p.id} onClick={() => cancelar(p.id)}>
                    Cancelar
                  </Button>
                  <Button variant="secondary" disabled={isPending && emAcao === p.id} onClick={() => retirar(p.id)}>
                    Marcar como retirado
                  </Button>
                </div>
              )}
              {p.status === "pendente" && (
                <Button variant="perigo" disabled={isPending && emAcao === p.id} onClick={() => cancelar(p.id)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
