"use client";

import { useState, useTransition } from "react";
import { UserSquare2 } from "lucide-react";
import { ProfissionalForm } from "./profissional-form";
import { alternarAtivoProfissional } from "./actions";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Jornada = { dia_semana: number; hora_inicio: string; hora_fim: string };

export function ProfissionaisClient({
  profissionais,
  servicos,
  jornadasPorProfissional,
  servicoIdsPorProfissional,
}: {
  profissionais: Profissional[];
  servicos: Servico[];
  jornadasPorProfissional: Record<string, Jornada[]>;
  servicoIdsPorProfissional: Record<string, string[]>;
}) {
  const [editando, setEditando] = useState<Profissional | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <ProfissionalForm
          key={editando === "novo" ? "novo" : editando.id}
          profissional={editando === "novo" ? null : editando}
          servicos={servicos}
          jornadasIniciais={editando === "novo" ? [] : jornadasPorProfissional[editando.id] ?? []}
          servicoIdsIniciais={editando === "novo" ? [] : servicoIdsPorProfissional[editando.id] ?? []}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit text-sm">
          Novo profissional
        </Button>
      )}

      {profissionais.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          titulo="Nenhum profissional cadastrado ainda"
          descricao="Use o botão acima para cadastrar o primeiro profissional."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-cinza-600">
                <th className="py-2 font-medium">Nome</th>
                <th className="font-medium">Comissão</th>
                <th className="font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profissionais.map((p) => (
                <tr key={p.id} className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">{p.nome}</td>
                  <td className="tabular-nums">{p.comissao_percentual}%</td>
                  <td className={p.ativo ? "text-sucesso" : "text-cinza-600"}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </td>
                  <td className="flex gap-2 py-2 text-right">
                    <Button variant="ghost" onClick={() => setEditando(p)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => startTransition(() => alternarAtivoProfissional(p.id, !p.ativo))}
                    >
                      {p.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
