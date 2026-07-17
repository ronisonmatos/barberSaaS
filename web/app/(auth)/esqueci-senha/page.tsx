"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { solicitarRecuperacaoSenha } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";

export default function EsqueciSenhaPage() {
  const [state, action, pending] = useActionState(solicitarRecuperacaoSenha, undefined);
  const [submetido, setSubmetido] = useState(false);
  const mostrarSucesso = submetido && !pending && !state?.error;

  if (mostrarSucesso) {
    return (
      <div className="flex flex-col gap-4">
        <Heading>Verifique seu e-mail</Heading>
        <p className="text-sm text-cinza-600">
          Se houver uma conta com esse e-mail, enviamos um link para você definir uma nova senha.
        </p>
        <Link href="/login" className="w-fit text-sm text-latao-escuro underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={() => setSubmetido(true)} className="flex flex-col gap-4">
      <Heading>Esqueci minha senha</Heading>
      <p className="text-sm text-cinza-600">
        Informe seu e-mail e enviaremos um link para você definir uma nova senha.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required />
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>

      <Link href="/login" className="w-fit text-sm text-latao-escuro underline">
        Voltar para o login
      </Link>
    </form>
  );
}
