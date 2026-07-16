"use client";

import { useActionState } from "react";
import { salvarCliente } from "./actions";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function ClienteForm({ cliente, onDone }: { cliente?: Cliente | null; onDone?: () => void }) {
  const [state, action, pending] = useActionState(salvarCliente, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4"
    >
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <Input name="nome" required defaultValue={cliente?.nome} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Telefone (WhatsApp)</label>
          <Input
            name="telefone"
            required
            placeholder="(47) 99999-9999"
            defaultValue={cliente?.telefone}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">E-mail</label>
          <Input name="email" type="email" defaultValue={cliente?.email ?? ""} />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            name="observacoes"
            defaultValue={cliente?.observacoes ?? ""}
            className="rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao placeholder:text-cinza-300 focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          />
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {cliente && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
