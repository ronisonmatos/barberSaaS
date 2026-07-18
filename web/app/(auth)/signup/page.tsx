"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { formatarCPF } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [cpf, setCpf] = useState("");

  return (
    <form action={action} className="flex flex-col gap-4">
      <Heading>Criar conta</Heading>

      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-sm font-medium">
          Seu nome
        </label>
        <Input id="nome" name="nome" required placeholder="Nome completo." />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Gênero</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="genero" value="masculino" required />
            Masculino
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="genero" value="feminino" required />
            Feminino
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cpf" className="text-sm font-medium">
          CPF
        </label>
        <Input
          id="cpf"
          name="cpf"
          required
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(formatarCPF(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar conta"}
      </Button>

      <p className="text-sm text-cinza-600">
        Já tem conta?{" "}
        <Link href="/login" className="text-latao-escuro underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
