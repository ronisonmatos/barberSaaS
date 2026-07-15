"use client";

import { useState } from "react";
import { NovoAgendamentoDialog } from "./novo-agendamento-dialog";
import { AgendamentoCard, type AgendamentoDetalhado } from "./agendamento-card";
import type { Database } from "@/lib/supabase/types";

type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function AgendaClient({
  data,
  profissionais,
  servicos,
  clientes,
  agendamentosPorProfissional,
}: {
  data: string;
  profissionais: Profissional[];
  servicos: Servico[];
  clientes: Cliente[];
  agendamentosPorProfissional: Partial<Record<string, AgendamentoDetalhado[]>>;
}) {
  const [dialogAberto, setDialogAberto] = useState<{ profissionalId?: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setDialogAberto({})}
        className="w-fit rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
      >
        Novo agendamento
      </button>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${profissionais.length || 1}, minmax(220px, 1fr))` }}>
        {profissionais.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{p.nome}</p>
              <button
                onClick={() => setDialogAberto({ profissionalId: p.id })}
                className="text-sm text-neutral-500 underline"
              >
                + agendar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(agendamentosPorProfissional[p.id] ?? []).map((ag) => (
                <AgendamentoCard key={ag.id} agendamento={ag} />
              ))}
              {(agendamentosPorProfissional[p.id] ?? []).length === 0 && (
                <p className="text-sm text-neutral-400">Sem agendamentos</p>
              )}
            </div>
          </div>
        ))}
        {profissionais.length === 0 && (
          <p className="text-neutral-500">Cadastre um profissional para começar a agendar.</p>
        )}
      </div>

      {dialogAberto && (
        <NovoAgendamentoDialog
          data={data}
          profissionais={profissionais}
          servicos={servicos}
          clientes={clientes}
          profissionalInicial={dialogAberto.profissionalId}
          onClose={() => setDialogAberto(null)}
        />
      )}
    </div>
  );
}
