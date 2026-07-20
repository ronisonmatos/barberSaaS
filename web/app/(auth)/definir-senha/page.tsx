"use client";

import { useActionState, useState } from "react";
import { definirSenha } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";

export default function DefinirSenhaPage() {
  const [state, action, pending] = useActionState(definirSenha, undefined);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const naoConfere = confirmacao.length > 0 && senha !== confirmacao;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Heading>Defina sua senha</Heading>
      <p className="text-sm text-cinza-600">
        Você foi convidado a acessar o Comptus. Escolha uma senha para concluir seu cadastro.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Nova senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmacao" className="text-sm font-medium">
          Confirmar senha
        </label>
        <PasswordInput
          id="confirmacao"
          required
          minLength={8}
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          error={naoConfere}
        />
        {naoConfere && <FormError>As senhas não conferem.</FormError>}
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending || naoConfere || senha.length < 8}>
        {pending ? "Salvando..." : "Salvar senha e entrar"}
      </Button>
    </form>
  );
}
