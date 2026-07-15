"use client";

import { useActionState } from "react";
import { salvarServico } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

export function ServicoForm({
  servico,
  onDone,
}: {
  servico?: Servico | null;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarServico, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      {servico && <input type="hidden" name="id" value={servico.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <input
            name="nome"
            required
            defaultValue={servico?.nome}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Duração (min)</label>
          <input
            name="duracao_minutos"
            type="number"
            min={1}
            required
            defaultValue={servico?.duracao_minutos}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Preço (R$)</label>
          <input
            name="preco"
            required
            defaultValue={servico ? (servico.preco_centavos / 100).toFixed(2) : ""}
            placeholder="40,00"
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Categoria</label>
          <input
            name="categoria"
            defaultValue={servico?.categoria ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            name="descricao"
            defaultValue={servico?.descricao ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        {servico && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
