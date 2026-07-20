"use client";

import { useActionState, useEffect, useState } from "react";
import { salvarProdutoRascunho } from "./actions";
import { centavosParaCampoBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Produto = Database["public"]["Tables"]["produtos"]["Row"];

export function ProdutoFormRascunho({
  estabelecimentoId,
  produto,
  onDone,
}: {
  estabelecimentoId: string;
  produto?: Produto | null;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarProdutoRascunho, undefined);
  const [fotoPreview, setFotoPreview] = useState<string | null>(produto?.foto_url ?? null);

  useEffect(() => {
    return () => {
      if (fotoPreview && fotoPreview.startsWith("blob:")) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setFotoPreview(URL.createObjectURL(arquivo));
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4"
    >
      <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />
      {produto && <input type="hidden" name="id" value={produto.id} />}

      <div className="flex items-center gap-4">
        <label
          htmlFor="input-foto-produto"
          className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-linha"
        >
          {fotoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element -- preview local/foto em bucket público */
            <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[10px] text-cinza-600">Sem foto</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-carvao/60 text-[11px] font-medium text-marfim opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            Alterar
          </span>
        </label>
        <input
          id="input-foto-produto"
          type="file"
          name="foto"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFoto}
          className="sr-only"
        />
        <p className="text-xs text-cinza-300">PNG, JPEG, WEBP ou SVG — até 5MB.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <Input name="nome" required defaultValue={produto?.nome} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Preço (R$)</label>
          <Input
            name="preco"
            required
            defaultValue={produto ? centavosParaCampoBRL(produto.preco_centavos) : ""}
            placeholder="40,00"
          />
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {produto && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
