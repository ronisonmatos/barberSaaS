"use client";

import { useActionState, useRef, useState } from "react";
import { salvarIdentidadeRascunho, enviarLogoRascunho } from "./actions";
import { TAMANHO_MAX_LOGO_BYTES } from "@/app/(app)/app/configuracoes/limites";
import { slugify } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

const TEMAS = [
  { valor: "classica", label: "Clássica", bg: "#17191C", acento: "#C9A15C" },
  { valor: "moderna", label: "Moderna", bg: "#F4F2ED", acento: "#17191C" },
  { valor: "delicada", label: "Delicada", bg: "#FAF7F4", acento: "#B4826E" },
] as const;

type TemaGratisPremium = { chave: string; nome: string; descricao: string | null; fotoPreviewUrl: string | null };

function formatarMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

export function IdentidadeForm({
  estabelecimentoId,
  nomeAtual,
  slugAtual,
  temaAtual,
  layoutAtual,
  temasGratisPremium,
  logoUrl,
}: {
  estabelecimentoId: string;
  nomeAtual: string;
  slugAtual: string;
  temaAtual: string;
  layoutAtual: string;
  temasGratisPremium: TemaGratisPremium[];
  logoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(salvarIdentidadeRascunho, undefined);
  const [logoState, logoAction, logoPending] = useActionState(enviarLogoRascunho, undefined);
  const [nome, setNome] = useState(nomeAtual);
  const [slug, setSlug] = useState(slugAtual);
  const [tema, setTema] = useState<(typeof TEMAS)[number]["valor"]>(
    (TEMAS.find((t) => t.valor === temaAtual)?.valor ?? "classica") as (typeof TEMAS)[number]["valor"]
  );
  const [layout, setLayout] = useState(layoutAtual);
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
        <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />
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

      <form action={action} className="flex flex-col gap-4 border-t border-linha pt-6">
        <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />

        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="text-sm font-medium">
            Nome do estabelecimento
          </label>
          <Input
            id="nome"
            name="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="slug" className="text-sm font-medium">
            Endereço da página pública
          </label>
          <div className="flex max-w-sm items-center gap-1 text-sm text-cinza-600">
            <span>/b/</span>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-cinza-300">Mudar o endereço muda o link que você já enviou pro cliente.</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Tema da página pública</p>
          <div className="grid max-w-sm grid-cols-3 gap-2">
            {TEMAS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTema(t.valor)}
                aria-pressed={tema === t.valor}
                className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                  tema === t.valor ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
                }`}
              >
                <span className="flex h-10 w-full items-center justify-center rounded-sm" style={{ background: t.bg }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: t.acento }} />
                </span>
                <span className="text-xs font-medium text-carvao">{t.label}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="tema" value={tema} />
        </div>

        {temasGratisPremium.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Template da página pública</p>
            <div className="grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setLayout("classico")}
                aria-pressed={layout === "classico"}
                className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                  layout === "classico" ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
                }`}
              >
                <span className="text-xs font-medium text-carvao">Clássico</span>
                <span className="text-xs text-cinza-600">Cartão único, direto ao ponto.</span>
              </button>
              {temasGratisPremium.map((t) => (
                <button
                  key={t.chave}
                  type="button"
                  onClick={() => setLayout(t.chave)}
                  aria-pressed={layout === t.chave}
                  className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                    layout === t.chave ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
                  }`}
                >
                  {t.fotoPreviewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- imagem em bucket público */
                    <img
                      src={t.fotoPreviewUrl}
                      alt={`Prévia do template ${t.nome}`}
                      className="aspect-video w-full rounded-sm border border-linha object-cover"
                    />
                  ) : null}
                  <span className="text-xs font-medium text-carvao">{t.nome}</span>
                  {t.descricao && <span className="text-xs text-cinza-600">{t.descricao}</span>}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-cinza-300">
              Só templates atualmente grátis aparecem aqui — rascunho não tem dono nem pagamento pra comprar
              os pagos.
            </p>
            <input type="hidden" name="layout" value={layout} />
          </div>
        )}
        {temasGratisPremium.length === 0 && <input type="hidden" name="layout" value="classico" />}

        {state?.error && <FormError>{state.error}</FormError>}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
