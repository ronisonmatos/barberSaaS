"use client";

import { useActionState, useState } from "react";
import { salvarMinhaConta } from "./actions";
import { formatarCPF } from "@/lib/cpf";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function MinhaContaForm({
  nomeAtual,
  generoAtual,
  cpfAtual,
}: {
  nomeAtual: string;
  generoAtual: "masculino" | "feminino" | null;
  cpfAtual: string | null;
}) {
  const [state, action, pending] = useActionState(salvarMinhaConta, undefined);
  const [cpf, setCpf] = useState(cpfAtual ? formatarCPF(cpfAtual) : "");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-sm font-medium">
          Seu nome
        </label>
        <Input id="nome" name="nome" required defaultValue={nomeAtual} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Gênero</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="genero"
              value="masculino"
              defaultChecked={generoAtual === "masculino"}
              required
            />
            Masculino
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="genero"
              value="feminino"
              defaultChecked={generoAtual === "feminino"}
              required
            />
            Feminino
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cpf" className="text-sm font-medium">
          CPF (opcional)
        </label>
        <Input
          id="cpf"
          name="cpf"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(formatarCPF(e.target.value))}
        />
        <p className="text-xs text-cinza-600">
          Só é necessário se você for contratar um plano pago com cartão de crédito.
        </p>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
