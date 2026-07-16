"use client";

import { useActionState } from "react";
import { salvarPerfil, atualizarLogo } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function PerfilForm({ nomeAtual, logoUrl }: { nomeAtual: string; logoUrl: string | null }) {
  const [nomeState, nomeAction, nomePending] = useActionState(salvarPerfil, undefined);
  const [logoState, logoAction, logoPending] = useActionState(atualizarLogo, undefined);

  return (
    <div className="flex flex-col gap-6">
      <form action={nomeAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="text-sm font-medium">
            Nome do estabelecimento
          </label>
          <Input id="nome" name="nome" required defaultValue={nomeAtual} className="max-w-sm" />
        </div>
        {nomeState?.error && <FormError>{nomeState.error}</FormError>}
        <Button type="submit" disabled={nomePending} className="w-fit">
          {nomePending ? "Salvando..." : "Salvar nome"}
        </Button>
      </form>

      <form action={logoAction} className="flex flex-col gap-3">
        <p className="text-sm font-medium">Logo</p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
            <img src={logoUrl} alt="Logo do estabelecimento" className="h-16 w-16 rounded-md border border-linha object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-linha text-xs text-cinza-600">
              Sem logo
            </div>
          )}
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required
            className="text-sm"
          />
        </div>
        {logoState?.error && <FormError>{logoState.error}</FormError>}
        <Button type="submit" disabled={logoPending} className="w-fit">
          {logoPending ? "Enviando..." : "Enviar logo"}
        </Button>
      </form>
    </div>
  );
}
