"use client";

import { useState } from "react";
import { UserSquare2 } from "lucide-react";
import { NovoAgendamentoDialog } from "./novo-agendamento-dialog";
import { AgendamentoCard, type AgendamentoDetalhado } from "./agendamento-card";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function AgendaClient({
  data,
  profissionais,
  servicos,
  clientes,
  agendamentosPorProfissional,
  podeReembolsar,
}: {
  data: string;
  profissionais: Profissional[];
  servicos: Servico[];
  clientes: Cliente[];
  agendamentosPorProfissional: Partial<Record<string, AgendamentoDetalhado[]>>;
  podeReembolsar: boolean;
}) {
  const [dialogAberto, setDialogAberto] = useState<{ profissionalId?: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setDialogAberto({})} className="w-fit text-sm">
        Novo agendamento
      </Button>

      {profissionais.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          titulo="Nenhum profissional ativo"
          descricao="Cadastre um profissional para começar a agendar."
          acao={{ label: "Cadastrar profissional", href: "/app/profissionais" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profissionais.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 rounded-md border border-linha bg-marfim-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 font-medium text-carvao">{p.nome}</p>
                <Button variant="ghost" className="text-sm" onClick={() => setDialogAberto({ profissionalId: p.id })}>
                  + agendar
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {(agendamentosPorProfissional[p.id] ?? []).map((ag) => (
                  <AgendamentoCard
                    key={ag.id}
                    agendamento={ag}
                    profissionalId={p.id}
                    podeReembolsar={podeReembolsar}
                  />
                ))}
                {(agendamentosPorProfissional[p.id] ?? []).length === 0 && (
                  <div className="rounded-sm border border-dashed border-linha p-2 text-sm text-cinza-300">
                    Sem agendamentos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
