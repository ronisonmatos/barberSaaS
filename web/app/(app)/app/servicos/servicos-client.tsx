"use client";

import { useState, useTransition } from "react";
import { ServicoForm } from "./servico-form";
import { alternarAtivoServico } from "./actions";
import { centavosToBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

export function ServicosClient({ servicos }: { servicos: Servico[] }) {
  const [editando, setEditando] = useState<Servico | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <ServicoForm
          key={editando === "novo" ? "novo" : editando.id}
          servico={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <button
          onClick={() => setEditando("novo")}
          className="w-fit rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Novo serviço
        </button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <th className="py-2">Nome</th>
            <th>Duração</th>
            <th>Preço</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {servicos.map((s) => (
            <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2">{s.nome}</td>
              <td>{s.duracao_minutos}min</td>
              <td>{centavosToBRL(s.preco_centavos)}</td>
              <td>{s.ativo ? "Ativo" : "Inativo"}</td>
              <td className="flex gap-2 py-2 text-right">
                <button className="underline" onClick={() => setEditando(s)}>
                  Editar
                </button>
                <button
                  disabled={isPending}
                  className="underline"
                  onClick={() => startTransition(() => alternarAtivoServico(s.id, !s.ativo))}
                >
                  {s.ativo ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
          {servicos.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-neutral-500">
                Nenhum serviço cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
