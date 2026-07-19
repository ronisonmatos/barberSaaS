"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { salvarTema, atualizarPreviewTema } from "./actions";
import { centavosParaCampoBRL } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import type { Database } from "@/lib/supabase/types";

type Tema = Database["public"]["Tables"]["temas_plataforma"]["Row"];

export function TemaForm({ tema, onDone }: { tema?: Tema | null; onDone?: () => void }) {
  const [state, action, pending] = useActionState(salvarTema, undefined);
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current && !pending) {
      enviado.current = false;
      if (!state?.error) onDone?.();
    }
  }, [pending, state, onDone]);

  const [previewState, previewAction, previewPending] = useActionState(atualizarPreviewTema, undefined);
  const [previewUrl, setPreviewUrl] = useState(tema?.foto_preview_url ?? null);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-linha p-4">
      <form
        action={(formData) => {
          enviado.current = true;
          action(formData);
        }}
        className="flex flex-col gap-3"
      >
        {tema && <input type="hidden" name="id" value={tema.id} />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nome</label>
            <Input name="nome" required defaultValue={tema?.nome} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Chave (usada em data-tema, ex: prestigio)</label>
            {/* disabled não envia o campo no FormData -- quando editando, o valor real vai num
                hidden input à parte, e este aqui fica só pra exibição/UX. */}
            <Input name={tema ? undefined : "chave"} required defaultValue={tema?.chave} disabled={Boolean(tema)} />
            {tema && <input type="hidden" name="chave" value={tema.chave} />}
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">Descrição (aparece pro dono do estabelecimento)</label>
            <Input name="descricao" defaultValue={tema?.descricao ?? ""} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Preço (R$)</label>
            <Input
              name="preco"
              required
              placeholder="149,00"
              defaultValue={tema ? centavosParaCampoBRL(tema.preco_centavos) : ""}
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="gratis" defaultChecked={tema?.gratis ?? false} />
              Gratuito (libera pra todo mundo, sem checkout)
            </label>
          </div>
        </div>

        {state?.error && <FormError>{state.error}</FormError>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          {tema && (
            <Button type="button" variant="secondary" onClick={onDone}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {tema && (
        <form action={previewAction} className="flex flex-col gap-2 border-t border-linha pt-3">
          <input type="hidden" name="temaId" value={tema.id} />
          <label className="text-sm font-medium">Foto de prévia (mostrada pro dono decidir se compra)</label>
          <div className="flex items-center gap-3">
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- imagem em bucket público */
              <img src={previewUrl} alt="" className="h-16 w-28 rounded-sm border border-linha object-cover" />
            ) : (
              <div className="flex h-16 w-28 items-center justify-center rounded-sm border border-linha text-xs text-cinza-600">
                Sem foto
              </div>
            )}
            <input
              type="file"
              name="preview"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) setPreviewUrl(URL.createObjectURL(arquivo));
                e.target.form?.requestSubmit();
              }}
              className="text-sm"
            />
          </div>
          {previewPending && <p className="text-xs text-cinza-600">Enviando...</p>}
          {previewState?.error && <FormError>{previewState.error}</FormError>}
        </form>
      )}
    </div>
  );
}
