"use client";

import { useActionState, useTransition } from "react";
import { criarBloqueio, excluirBloqueio } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Bloqueio = Database["public"]["Tables"]["bloqueios"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function BloqueiosClient({
  bloqueios,
  profissionais,
}: {
  bloqueios: Bloqueio[];
  profissionais: Profissional[];
}) {
  const [state, action, pending] = useActionState(criarBloqueio, undefined);
  const [isPending, startTransition] = useTransition();

  const nomeProfissional = (id: string | null) =>
    id ? profissionais.find((p) => p.id === id)?.nome ?? "—" : "Barbearia inteira";

  return (
    <div className="flex flex-col gap-4">
      <form
        action={action}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Profissional</label>
          <select
            name="profissional_id"
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="">Barbearia inteira</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Início</label>
          <input
            type="datetime-local"
            name="inicio"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Fim</label>
          <input
            type="datetime-local"
            name="fim"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Motivo</label>
          <input
            name="motivo"
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Salvando..." : "Adicionar bloqueio"}
        </button>
        {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <th className="py-2">Profissional</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Motivo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bloqueios.map((b) => (
            <tr key={b.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2">{nomeProfissional(b.profissional_id)}</td>
              <td>{formatarDataHora(b.inicio)}</td>
              <td>{formatarDataHora(b.fim)}</td>
              <td>{b.motivo}</td>
              <td className="text-right">
                <button
                  disabled={isPending}
                  className="underline"
                  onClick={() => startTransition(() => excluirBloqueio(b.id))}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          {bloqueios.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-neutral-500">
                Nenhum bloqueio cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
