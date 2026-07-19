"use client";

import { useActionState } from "react";
import { salvarServico } from "./actions";
import { centavosParaCampoBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

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
      className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4"
    >
      {servico && <input type="hidden" name="id" value={servico.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <Input name="nome" required defaultValue={servico?.nome} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Duração (min)</label>
          <Input
            name="duracao_minutos"
            type="number"
            min={1}
            required
            defaultValue={servico?.duracao_minutos}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Preço (R$)</label>
          <Input
            name="preco"
            required
            defaultValue={servico ? centavosParaCampoBRL(servico.preco_centavos) : ""}
            placeholder="40,00"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Categoria</label>
          <Input name="categoria" defaultValue={servico?.categoria ?? ""} />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            name="descricao"
            defaultValue={servico?.descricao ?? ""}
            className="rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao placeholder:text-cinza-300 focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          />
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {servico && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
