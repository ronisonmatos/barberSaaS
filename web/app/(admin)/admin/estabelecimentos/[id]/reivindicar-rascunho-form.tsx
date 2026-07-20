"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { convidarDonoRascunho } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function ReivindicarRascunhoForm({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [state, action, pending] = useActionState(convidarDonoRascunho, undefined);
  const searchParams = useSearchParams();
  const nomeSugerido = searchParams.get("nome") ?? "";
  const emailSugerido = searchParams.get("email") ?? "";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />

      {emailSugerido && (
        <p className="text-sm text-cinza-600">
          Pediu ativação pela página pública — nome e e-mail já preenchidos abaixo, só conferir e enviar.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-sm font-medium">
          Nome do dono
        </label>
        <Input id="nome" name="nome" required defaultValue={nomeSugerido} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail do dono
        </label>
        <Input id="email" name="email" type="email" required defaultValue={emailSugerido} />
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando convite..." : "Enviar convite de reivindicação"}
      </Button>
    </form>
  );
}
