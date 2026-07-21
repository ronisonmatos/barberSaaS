"use client";

import { useActionState, useRef, useState } from "react";
import { salvarIdentidadeRascunho, enviarLogoRascunho } from "./actions";
import { TAMANHO_MAX_LOGO_BYTES } from "@/app/(app)/app/configuracoes/limites";
import { slugify } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

type Tema = "classica" | "moderna" | "delicada" | "personalizado";
type Cores = { bg: string; bg2: string; fg: string; linha: string; acento: string; acentoFg: string };
type TemaGratisPremium = { chave: string; nome: string; descricao: string | null; fotoPreviewUrl: string | null };

// Precisam ficar em sincronia com os presets [data-tema] em app/globals.css (mesmos valores de
// configuracoes/aparencia/aparencia-form.tsx, o equivalente pro estabelecimento real).
const PRESETS: Record<Exclude<Tema, "personalizado">, Cores> = {
  classica: { bg: "#17191c", bg2: "#22262a", fg: "#f4f2ed", linha: "#2e3237", acento: "#c9a15c", acentoFg: "#17191c" },
  moderna: { bg: "#f4f2ed", bg2: "#ffffff", fg: "#17191c", linha: "#e5e1d8", acento: "#17191c", acentoFg: "#f4f2ed" },
  delicada: { bg: "#faf7f4", bg2: "#ffffff", fg: "#3a3330", linha: "#ecdfd9", acento: "#b4826e", acentoFg: "#faf7f4" },
};

const PRESETS_LABEL: Record<Exclude<Tema, "personalizado">, string> = {
  classica: "Clássica",
  moderna: "Moderna",
  delicada: "Delicada",
};

const CAMPOS: { chave: keyof Cores; label: string; descricao: string }[] = [
  { chave: "bg", label: "Fundo", descricao: "Fundo da página e dos blocos internos." },
  { chave: "bg2", label: "Fundo do cartão", descricao: "Fundo do cartão principal que envolve a página pública." },
  { chave: "fg", label: "Texto", descricao: "Cor do texto em toda a página pública." },
  { chave: "linha", label: "Linhas e bordas", descricao: "Bordas de cards, divisórias e contorno dos profissionais." },
  { chave: "acento", label: "Destaque", descricao: 'Botão "Agendar horário", títulos de seção, seleção de data e horário.' },
  { chave: "acentoFg", label: "Texto sobre o destaque", descricao: 'Cor do texto em cima do destaque — ex: dentro do botão "Agendar horário".' },
];

function corEquivalenteAPreset(cores: Cores): Tema {
  for (const [tema, preset] of Object.entries(PRESETS) as [Exclude<Tema, "personalizado">, Cores][]) {
    if (Object.keys(preset).every((k) => preset[k as keyof Cores] === cores[k as keyof Cores])) return tema;
  }
  return "personalizado";
}

function formatarMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

export function IdentidadeForm({
  estabelecimentoId,
  nomeAtual,
  slugAtual,
  temaAtual,
  layoutAtual,
  coresAtuais,
  temasGratisPremium,
  logoUrl,
}: {
  estabelecimentoId: string;
  nomeAtual: string;
  slugAtual: string;
  temaAtual: string;
  layoutAtual: string;
  coresAtuais: Cores | null;
  temasGratisPremium: TemaGratisPremium[];
  logoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(salvarIdentidadeRascunho, undefined);
  const [logoState, logoAction, logoPending] = useActionState(enviarLogoRascunho, undefined);
  const [nome, setNome] = useState(nomeAtual);
  const [slug, setSlug] = useState(slugAtual);
  const [layout, setLayout] = useState(layoutAtual);
  const [cores, setCores] = useState<Cores>(
    coresAtuais ?? PRESETS[(temaAtual as Exclude<Tema, "personalizado">) in PRESETS ? (temaAtual as Exclude<Tema, "personalizado">) : "classica"]
  );
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const logoFormRef = useRef<HTMLFormElement>(null);

  const temaAtivo = corEquivalenteAPreset(cores);

  function atualizarCor(chave: keyof Cores, valor: string) {
    setCores((c) => ({ ...c, [chave]: valor }));
  }

  async function selecionarLogo(e: React.ChangeEvent<HTMLInputElement>) {
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
          <p className="mb-2 text-sm font-medium">Paleta de cores</p>
          <div className="grid max-w-sm grid-cols-3 gap-2">
            {(Object.keys(PRESETS) as Exclude<Tema, "personalizado">[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCores(PRESETS[t])}
                aria-pressed={temaAtivo === t}
                className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                  temaAtivo === t ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
                }`}
              >
                <span className="flex h-10 w-full items-center justify-center rounded-sm" style={{ background: PRESETS[t].bg }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: PRESETS[t].acento }} />
                </span>
                <span className="text-xs font-medium text-carvao">{PRESETS_LABEL[t]}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-cinza-300">
            {temaAtivo === "personalizado"
              ? "Cores personalizadas — deixa a demonstração com a cara do cliente."
              : "Escolha uma paleta pronta ou ajuste as cores individuais abaixo pra deixar exclusivo."}
          </p>
          <input type="hidden" name="tema" value={temaAtivo} />
          <input type="hidden" name="bg" value={cores.bg} />
          <input type="hidden" name="bg2" value={cores.bg2} />
          <input type="hidden" name="fg" value={cores.fg} />
          <input type="hidden" name="linha" value={cores.linha} />
          <input type="hidden" name="acento" value={cores.acento} />
          <input type="hidden" name="acentoFg" value={cores.acentoFg} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Cores individuais</p>
          {CAMPOS.map((campo) => (
            <div key={campo.chave} className="flex items-start gap-3">
              <input
                type="color"
                value={cores[campo.chave]}
                onChange={(e) => atualizarCor(campo.chave, e.target.value)}
                className="h-11 w-11 shrink-0 cursor-pointer rounded-sm border border-linha p-0.5"
                aria-label={campo.label}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-carvao">{campo.label}</p>
                  <Input
                    value={cores[campo.chave]}
                    onChange={(e) => atualizarCor(campo.chave, e.target.value)}
                    className="h-7 w-28 text-xs"
                  />
                </div>
                <p className="text-xs text-cinza-600">{campo.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Pré-visualização</p>
          <div className="max-w-sm overflow-hidden rounded-[20px] p-4 shadow-xl" style={{ background: cores.bg2, color: cores.fg }}>
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {nome || "Nome do estabelecimento"}
            </p>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: cores.acento }}>
              Serviços
            </p>
            <div className="mb-3 flex items-center justify-between rounded-xl p-3" style={{ background: cores.bg }}>
              <p className="text-sm font-semibold">Corte de cabelo</p>
              <p className="text-sm font-bold">R$ 45,00</p>
            </div>
            <div className="mb-3 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: cores.linha, width: "fit-content" }}>
              Profissional
            </div>
            <div className="rounded-md p-2.5 text-center text-sm font-semibold" style={{ background: cores.acento, color: cores.acentoFg }}>
              Agendar horário
            </div>
          </div>
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
