"use client";

import { useActionState } from "react";
import { salvarFraseCurta } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

export function FraseCurtaForm({ descricaoAtual }: { descricaoAtual: string | null }) {
  const [state, action, pending] = useActionState(salvarFraseCurta, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="descricao-template" className="text-xs text-cinza-600">
        Frase curta que aparece abaixo do nome no topo da home. Vazia, mostra &ldquo;Bem-vindo(a)!&rdquo;.
      </label>
      <Input
        id="descricao-template"
        name="descricao"
        maxLength={140}
        placeholder="Agende seu horário em poucos cliques"
        defaultValue={descricaoAtual ?? ""}
      />
      {state?.error && <FormError>{state.error}</FormError>}
      <Button type="submit" disabled={pending} className="w-fit text-sm">
        {pending ? "Salvando..." : "Salvar frase"}
      </Button>
    </form>
  );
}
