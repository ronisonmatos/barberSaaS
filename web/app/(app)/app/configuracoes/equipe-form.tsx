"use client";

import { useActionState, useState, useTransition } from "react";
import { convidarMembro, removerMembro } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { papelLabel } from "@/lib/papel-label";

type Membro = {
  id: string;
  nome: string;
  genero: "masculino" | "feminino" | null;
  papel: "owner" | "staff";
  usuarioId: string;
  ativo: boolean;
  desativadoPorLimitePlano: boolean;
};

export function EquipeForm({
  membros,
  limite,
  meuUsuarioId,
}: {
  membros: Membro[];
  limite: number | null;
  meuUsuarioId: string;
}) {
  const [state, action, pending] = useActionState(convidarMembro, undefined);
  const [isPending, startTransition] = useTransition();
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erroRemover, setErroRemover] = useState<string | null>(null);

  const usados = membros.filter((m) => m.ativo).length;
  const limiteAtingido = limite !== null && usados >= limite;

  function remover(id: string) {
    setErroRemover(null);
    setRemovendoId(id);
    startTransition(async () => {
      const r = await removerMembro(id);
      if (r.error) setErroRemover(r.error);
      setRemovendoId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cinza-600">
        {usados} de {limite ?? "∞"} usuário{usados === 1 ? "" : "s"} usados
      </p>

      <ul className="flex flex-col gap-2">
        {membros.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-linha bg-marfim-2 p-3 text-sm"
          >
            <div>
              <p className="font-medium text-carvao">{m.nome}</p>
              <p className="text-xs text-cinza-600">
                {papelLabel(m.papel, m.genero)}
                {!m.ativo && m.desativadoPorLimitePlano ? " · Desativado (limite do plano)" : ""}
              </p>
            </div>
            {m.papel !== "owner" && m.usuarioId !== meuUsuarioId && (
              <Button
                variant="perigo"
                className="text-xs"
                disabled={isPending && removendoId === m.id}
                onClick={() => remover(m.id)}
              >
                {isPending && removendoId === m.id ? "Removendo..." : "Remover"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {erroRemover && <FormError>{erroRemover}</FormError>}

      {limiteAtingido ? (
        <p className="text-sm text-aviso">
          Limite de usuários do plano atingido. Faça upgrade de plano para convidar mais gente.
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4">
          <p className="text-sm font-medium">Convidar novo usuário</p>
          <div className="flex flex-col gap-1">
            <label htmlFor="nome-membro" className="text-sm font-medium">
              Nome
            </label>
            <Input id="nome-membro" name="nome" required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email-membro" className="text-sm font-medium">
              E-mail
            </label>
            <Input id="email-membro" name="email" type="email" required />
          </div>
          {state?.error && <FormError>{state.error}</FormError>}
          {state?.aviso && <p className="text-sm text-latao-escuro">{state.aviso}</p>}
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Convidando..." : "Convidar"}
          </Button>
        </form>
      )}
    </div>
  );
}
