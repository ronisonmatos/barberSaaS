"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { adicionarFotos, removerFoto } from "./actions";
import { TAMANHO_MAX_LOGO_BYTES } from "./limites";
import { FormError } from "@/components/ui/form-error";
import { plural } from "@/lib/plural";

function formatarMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

type Foto = { id: string; url: string; ativo: boolean; desativadoPorLimitePlano: boolean };

export function GaleriaForm({ fotos, limite }: { fotos: Foto[]; limite: number | null }) {
  const [state, action, pending] = useActionState(adicionarFotos, undefined);
  const [isPending, startTransition] = useTransition();
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [erroRemover, setErroRemover] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const usadas = fotos.filter((f) => f.ativo).length;
  const limiteAtingido = limite !== null && usadas >= limite;

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
      const r = await removerFoto(id);
      if (r.error) setErroRemover(r.error);
      setRemovendoId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-cinza-600">
        {usadas} de {limite ?? "∞"} {plural(limite ?? 0, "foto", "fotos")}{" "}
        {plural(limite ?? 0, "usada", "usadas")} · PNG, JPEG, WEBP ou SVG, até{" "}
        {formatarMB(TAMANHO_MAX_LOGO_BYTES)} cada
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {fotos.map((f) => (
          <div key={f.id} className="group relative aspect-square overflow-hidden rounded-md border border-linha">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */}
            <img src={f.url} alt="" className={`h-full w-full object-cover ${f.ativo ? "" : "opacity-40"}`} />
            {!f.ativo && f.desativadoPorLimitePlano && (
              <span className="absolute bottom-1 left-1 rounded bg-carvao/70 px-1.5 py-0.5 text-[10px] text-marfim">
                Oculta (limite do plano)
              </span>
            )}
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

      {limiteAtingido && (
        <p className="text-sm text-aviso">
          Limite de fotos do plano atingido. Faça upgrade de plano para adicionar mais.
        </p>
      )}
    </div>
  );
}
