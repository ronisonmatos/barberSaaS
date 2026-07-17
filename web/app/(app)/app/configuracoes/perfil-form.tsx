"use client";

import { useActionState, useRef, useState } from "react";
import { salvarPerfil, atualizarLogo } from "./actions";
import { TAMANHO_MAX_LOGO_BYTES } from "./limites";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

function formatarMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

const TEXTAREA_CLASS =
  "rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30";

export function PerfilForm({
  nomeAtual,
  logoUrl,
  descricaoAtual,
  sobreAtual,
  horarioTextoAtual,
  instagramUrlAtual,
  enderecoAtual,
}: {
  nomeAtual: string;
  logoUrl: string | null;
  descricaoAtual: string | null;
  sobreAtual: string | null;
  horarioTextoAtual: string | null;
  instagramUrlAtual: string | null;
  enderecoAtual: {
    rua?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    cep?: string | null;
  } | null;
}) {
  const [perfilState, perfilAction, perfilPending] = useActionState(salvarPerfil, undefined);
  const [logoState, logoAction, logoPending] = useActionState(atualizarLogo, undefined);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const logoFormRef = useRef<HTMLFormElement>(null);

  function selecionarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      setErroArquivo(`Imagem muito grande (máx. ${formatarMB(TAMANHO_MAX_LOGO_BYTES)}). Escolha outra.`);
      e.target.value = "";
      return;
    }
    setErroArquivo(null);
    logoFormRef.current?.requestSubmit();
  }

  return (
    <div className="flex flex-col gap-6">
      <form ref={logoFormRef} action={logoAction} className="flex flex-col gap-3">
        <p className="text-sm font-medium">Logo</p>
        <div className="flex items-center gap-4">
          <label
            htmlFor="input-logo"
            className={`group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-linha ${logoPending ? "pointer-events-none opacity-50" : ""}`}
          >
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
              <img src={logoUrl} alt="Logo do estabelecimento" className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center text-[10px] text-cinza-600">Sem logo</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-carvao/60 text-[11px] font-medium text-marfim opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {logoPending ? "Enviando..." : "Alterar"}
            </span>
          </label>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-cinza-600">Clique na imagem para trocar a logo.</p>
            <p className="text-xs text-cinza-300">
              PNG, JPEG, WEBP ou SVG — até {formatarMB(TAMANHO_MAX_LOGO_BYTES)}.
            </p>
          </div>
          <input
            id="input-logo"
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={selecionarLogo}
            disabled={logoPending}
            className="sr-only"
          />
        </div>
        {erroArquivo && <FormError>{erroArquivo}</FormError>}
        {logoState?.error && <FormError>{logoState.error}</FormError>}
      </form>

      <form action={perfilAction} className="flex flex-col gap-4 border-t border-linha pt-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="text-sm font-medium">
            Nome do estabelecimento
          </label>
          <Input id="nome" name="nome" required defaultValue={nomeAtual} className="max-w-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="descricao" className="text-sm font-medium">
            Frase curta (aparece abaixo do nome na página pública)
          </label>
          <Input
            id="descricao"
            name="descricao"
            maxLength={140}
            placeholder="Agende seu horário em poucos cliques"
            defaultValue={descricaoAtual ?? ""}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sobre" className="text-sm font-medium">
            Sobre o estabelecimento
          </label>
          <textarea
            id="sobre"
            name="sobre"
            rows={3}
            maxLength={600}
            placeholder="Conte em poucas linhas a história e o diferencial do seu negócio."
            defaultValue={sobreAtual ?? ""}
            className={TEXTAREA_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="horarioTexto" className="text-sm font-medium">
            Horário de funcionamento
          </label>
          <Input
            id="horarioTexto"
            name="horarioTexto"
            maxLength={200}
            placeholder="Seg–Sáb, 09h–19h"
            defaultValue={horarioTextoAtual ?? ""}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="instagramUrl" className="text-sm font-medium">
            Link do Instagram
          </label>
          <Input
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            placeholder="https://instagram.com/seu-negocio"
            defaultValue={instagramUrlAtual ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Endereço</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
            <Input name="rua" placeholder="Rua" defaultValue={enderecoAtual?.rua ?? ""} />
            <Input name="numero" placeholder="Número" defaultValue={enderecoAtual?.numero ?? ""} />
          </div>
          <Input name="bairro" placeholder="Bairro" defaultValue={enderecoAtual?.bairro ?? ""} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <Input name="cidade" placeholder="Cidade" defaultValue={enderecoAtual?.cidade ?? ""} />
            <Input name="uf" placeholder="UF" maxLength={2} defaultValue={enderecoAtual?.uf ?? ""} />
            <Input name="cep" placeholder="CEP" defaultValue={enderecoAtual?.cep ?? ""} />
          </div>
        </div>

        {perfilState?.error && <FormError>{perfilState.error}</FormError>}
        <Button type="submit" disabled={perfilPending} className="w-fit">
          {perfilPending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
