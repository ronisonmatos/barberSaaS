"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { salvarAparencia } from "./actions";

type Tema = "classica" | "moderna" | "delicada" | "prestigio" | "atelier" | "personalizado";
type TemaPreset = Exclude<Tema, "personalizado">;

type Cores = {
  bg: string;
  bg2: string;
  fg: string;
  linha: string;
  acento: string;
  acentoFg: string;
};

// Precisam ficar em sincronia com os presets [data-tema] em app/globals.css. "prestigio" e
// "atelier" são as paletas exclusivas dos templates premium de mesmo nome (ver
// estabelecimento_temas_comprados) -- só aparecem pra quem já comprou o template correspondente,
// controlado pela prop temasDesbloqueados.
const PRESETS: Record<TemaPreset, Cores> = {
  classica: { bg: "#17191c", bg2: "#22262a", fg: "#f4f2ed", linha: "#2e3237", acento: "#c9a15c", acentoFg: "#17191c" },
  moderna: { bg: "#f4f2ed", bg2: "#ffffff", fg: "#17191c", linha: "#e5e1d8", acento: "#17191c", acentoFg: "#f4f2ed" },
  delicada: { bg: "#faf7f4", bg2: "#ffffff", fg: "#3a3330", linha: "#ecdfd9", acento: "#b4826e", acentoFg: "#faf7f4" },
  prestigio: { bg: "#1b2a22", bg2: "#2f4a3a", fg: "#f4f2ed", linha: "#3f5347", acento: "#c9a15c", acentoFg: "#17191c" },
  atelier: { bg: "#f2ece1", bg2: "#e4dcc9", fg: "#1b1815", linha: "#d8cdb6", acento: "#7a2e2a", acentoFg: "#f2ece1" },
};

const PRESETS_LABEL: Record<TemaPreset, { label: string; desc: string }> = {
  classica: { label: "Clássica", desc: "Padrão atual — barbearia tradicional, escura com dourado." },
  moderna: { label: "Moderna", desc: "Clara e minimalista, para barbearia/estúdio jovem." },
  delicada: { label: "Delicada", desc: "Tons suaves de terracota, para salão de beleza." },
  prestigio: { label: "Prestígio", desc: "Verde profundo com dourado — exclusiva de quem comprou o template Prestígio." },
  atelier: { label: "Atelier", desc: "Tinta, papel e vermelho-navalha — combina especialmente bem com o template Atelier." },
};

const CAMPOS: { chave: keyof Cores; label: string; descricao: string }[] = [
  { chave: "bg", label: "Fundo", descricao: "Fundo da página e dos blocos internos (cards de serviço, horários, endereço)." },
  { chave: "bg2", label: "Fundo do cartão", descricao: "Fundo do cartão principal que envolve toda a página pública." },
  { chave: "fg", label: "Texto", descricao: "Cor do texto em toda a página pública." },
  { chave: "linha", label: "Linhas e bordas", descricao: "Bordas de cards, divisórias e contorno dos profissionais." },
  { chave: "acento", label: "Destaque", descricao: "Botão \"Agendar horário\", títulos de seção (Sobre/Serviços/Profissionais), seleção de data e horário." },
  { chave: "acentoFg", label: "Texto sobre o destaque", descricao: "Cor do texto em cima da cor de destaque — ex: o texto dentro do botão \"Agendar horário\"." },
];

function corEquivalenteAPreset(cores: Cores): Tema {
  for (const [tema, preset] of Object.entries(PRESETS) as [TemaPreset, Cores][]) {
    if (Object.keys(preset).every((k) => preset[k as keyof Cores] === cores[k as keyof Cores])) return tema;
  }
  return "personalizado";
}

export function AparenciaForm({
  coresIniciais,
  temasDesbloqueados,
}: {
  coresIniciais: Cores;
  temasDesbloqueados: string[];
}) {
  const [cores, setCores] = useState<Cores>(coresIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();

  const temaAtivo = corEquivalenteAPreset(cores);
  // "atelier" é liberada pra qualquer estabelecimento, igual Clássica/Moderna/Delicada -- só
  // "prestigio" continua exclusiva de quem comprou o template (decisão explícita do usuário).
  const PRESETS_DISPONIVEIS = (Object.keys(PRESETS) as TemaPreset[]).filter(
    (tema) => tema !== "prestigio" || temasDesbloqueados.includes(tema)
  );

  function atualizarCor(chave: keyof Cores, valor: string) {
    setSalvo(false);
    setCores((c) => ({ ...c, [chave]: valor }));
  }

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarAparencia({ tema: temaAtivo, ...cores });
      if (r.error) {
        setErro(r.error);
        return;
      }
      setSalvo(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-carvao">Paletas prontas</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS_DISPONIVEIS.map((tema) => (
            <button
              key={tema}
              type="button"
              onClick={() => {
                setSalvo(false);
                setCores(PRESETS[tema]);
              }}
              aria-pressed={temaAtivo === tema}
              className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                temaAtivo === tema ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
              }`}
            >
              <span
                className="flex h-10 w-full items-center justify-center rounded-sm"
                style={{ background: PRESETS[tema].bg }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: PRESETS[tema].acento }} />
              </span>
              <span className="text-xs font-medium text-carvao">{PRESETS_LABEL[tema].label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-cinza-600">
          {temaAtivo === "personalizado" ? "Cores personalizadas." : PRESETS_LABEL[temaAtivo].desc}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-carvao">Cores individuais</p>
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
        <p className="mb-2 text-sm font-medium text-carvao">Pré-visualização</p>
        <div
          className="overflow-hidden rounded-[20px] p-4 shadow-xl"
          style={{ background: cores.bg2, color: cores.fg }}
        >
          <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Nome do estabelecimento
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
          <div
            className="rounded-md p-2.5 text-center text-sm font-semibold"
            style={{ background: cores.acento, color: cores.acentoFg }}
          >
            Agendar horário
          </div>
        </div>
      </div>

      {erro && <FormError>{erro}</FormError>}
      {salvo && <p className="text-sm text-sucesso">Aparência salva.</p>}
      <Button disabled={pending} onClick={salvar} className="w-fit">
        {pending ? "Salvando..." : "Salvar aparência"}
      </Button>
    </div>
  );
}
