"use client";

import { useActionState } from "react";
import { abrirTicket } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Heading } from "@/components/ui/heading";

export default function NovoTicketPage() {
  const [state, action, pending] = useActionState(abrirTicket, undefined);

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Heading>Abrir chamado</Heading>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="assunto" className="text-sm font-medium">
            Assunto
          </label>
          <Input id="assunto" name="assunto" required />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mensagem" className="text-sm font-medium">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            name="mensagem"
            required
            rows={5}
            className="rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          />
        </div>
        {state?.error && <FormError>{state.error}</FormError>}
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Abrir chamado"}
        </Button>
      </form>
    </div>
  );
}
