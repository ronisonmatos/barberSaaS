"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { adicionarFotosRascunho, removerFotoRascunho } from "./actions";
import { TAMANHO_MAX_LOGO_BYTES } from "@/app/(app)/app/configuracoes/limites";
import { FormError } from "@/components/ui/form-error";
import { plural } from "@/lib/plural";

const LIMITE_FOTOS_RASCUNHO = 10;

function formatarMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

type Foto = { id: string; url: string };

export function GaleriaFormRascunho({ estabelecimentoId, fotos }: { estabelecimentoId: string; fotos: Foto[] }) {
  const [state, action, pending] = useActionState(adicionarFotosRascunho, undefined);
  const [isPending, startTransition] = useTransition();
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [erroRemover, setErroRemover] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const limiteAtingido = fotos.length >= LIMITE_FOTOS_RASCUNHO;

  function selecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0) return;

    const grandeDemais = arquivos.find((a) => a.size > TAMANHO_MAX_LOGO_BYTES);
    if (grandeDemais) {
      setErroArquivo(
        `"${grandeDemais.name}" é muito grande (máx. ${formatarMB(TAMANHO_MAX_LOGO_BYTES)}). Escolha outra.`
      );
      e.target.value = "";
      return;
    }
    setErroArquivo(null);
    formRef.current?.requestSubmit();
  }

  function remover(id: string) {
    setErroRemover(null);
    setRemovendoId(id);
    startTransition(async () => {
      const r = await removerFotoRascunho(estabelecimentoId, id);
      if (r.error) setErroRemover(r.error);
      setRemovendoId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-cinza-600">
        {fotos.length} de {LIMITE_FOTOS_RASCUNHO} {plural(LIMITE_FOTOS_RASCUNHO, "foto", "fotos")} usadas · PNG,
        JPEG, WEBP ou SVG, até {formatarMB(TAMANHO_MAX_LOGO_BYTES)} cada
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {fotos.map((f) => (
          <div key={f.id} className="group relative aspect-square overflow-hidden rounded-md border border-linha">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */}
            <img src={f.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={isPending && removendoId === f.id}
              onClick={() => remover(f.id)}
              aria-label="Remover foto"
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-carvao/70 text-marfim opacity-0 transition-opacity duration-150 hover:bg-erro focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}

        {!limiteAtingido && (
          <form ref={formRef} action={action} className="contents">
            <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />
            <label
              htmlFor="input-fotos"
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-linha text-cinza-600 transition-colors duration-150 hover:border-latao hover:text-latao-escuro ${pending ? "pointer-events-none opacity-50" : ""}`}
            >
              <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{pending ? "Enviando..." : "Adicionar"}</span>
            </label>
            <input
              id="input-fotos"
              type="file"
              name="fotos"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={selecionarArquivos}
              disabled={pending}
              className="sr-only"
            />
          </form>
        )}
      </div>

      {erroArquivo && <FormError>{erroArquivo}</FormError>}
      {state?.error && <FormError>{state.error}</FormError>}
      {erroRemover && <FormError>{erroRemover}</FormError>}

      {limiteAtingido && <p className="text-sm text-aviso">Limite de fotos atingido.</p>}
    </div>
  );
}
