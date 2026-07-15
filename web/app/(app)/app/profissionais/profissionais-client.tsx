"use client";

import { useState, useTransition } from "react";
import { ProfissionalForm } from "./profissional-form";
import { alternarAtivoProfissional } from "./actions";
import type { Database } from "@/lib/supabase/types";

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
        <button
          onClick={() => setEditando("novo")}
          className="w-fit rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Novo profissional
        </button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <th className="py-2">Nome</th>
            <th>Comissão</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profissionais.map((p) => (
            <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2">{p.nome}</td>
              <td>{p.comissao_percentual}%</td>
              <td>{p.ativo ? "Ativo" : "Inativo"}</td>
              <td className="flex gap-2 py-2 text-right">
                <button className="underline" onClick={() => setEditando(p)}>
                  Editar
                </button>
                <button
                  disabled={isPending}
                  className="underline"
                  onClick={() => startTransition(() => alternarAtivoProfissional(p.id, !p.ativo))}
                >
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
          {profissionais.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-neutral-500">
                Nenhum profissional cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
