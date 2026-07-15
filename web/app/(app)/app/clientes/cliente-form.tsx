"use client";

import { useActionState } from "react";
import { salvarCliente } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function ClienteForm({ cliente, onDone }: { cliente?: Cliente | null; onDone?: () => void }) {
  const [state, action, pending] = useActionState(salvarCliente, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <input
            name="nome"
            required
            defaultValue={cliente?.nome}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Telefone (WhatsApp)</label>
          <input
            name="telefone"
            required
            placeholder="(47) 99999-9999"
            defaultValue={cliente?.telefone}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">E-mail</label>
          <input
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            name="observacoes"
            defaultValue={cliente?.observacoes ?? ""}
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
        {cliente && (
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
