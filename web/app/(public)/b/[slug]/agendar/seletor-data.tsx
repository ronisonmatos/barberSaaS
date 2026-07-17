"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { somarDias } from "@/lib/timezone";
import { Input } from "@/components/ui/input";

const DIAS_JANELA = 7;

function formatarDiaSemana(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
    .format(data)
    .replace(".", "");
}

function formatarMesAno(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const texto = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    data
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const BOTAO_SETA =
  "flex h-8 w-8 items-center justify-center rounded-md border border-tenant-linha text-current transition-colors duration-150 hover:border-tenant-acento disabled:opacity-30 disabled:hover:border-tenant-linha focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";

export function SeletorData({
  value,
  onChange,
  min,
}: {
  value: string;
  onChange: (data: string) => void;
  min: string;
}) {
  const [janelaInicio, setJanelaInicio] = useState(() => (value < min ? min : value));
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const dias = Array.from({ length: DIAS_JANELA }, (_, i) => somarDias(janelaInicio, i));

  function voltarSemana() {
    const novo = somarDias(janelaInicio, -DIAS_JANELA);
    setJanelaInicio(novo < min ? min : novo);
  }

  function avancarSemana() {
    setJanelaInicio(somarDias(janelaInicio, DIAS_JANELA));
  }

  function escolherOutraData(novaData: string) {
    onChange(novaData);
    setJanelaInicio(novaData < min ? min : novaData);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-tenant-fg opacity-70">{formatarMesAno(janelaInicio)}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={voltarSemana}
            disabled={janelaInicio <= min}
            aria-label="Semana anterior"
            className={BOTAO_SETA}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={avancarSemana}
            aria-label="Próxima semana"
            className={BOTAO_SETA}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const hoje = dia === min;
          const selecionado = dia === value;
          return (
            <button
              key={dia}
              type="button"
              onClick={() => onChange(dia)}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-md border px-1 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2 ${
                selecionado
                  ? "border-tenant-acento bg-tenant-acento text-tenant-acento-fg"
                  : "border-tenant-linha bg-transparent text-current hover:border-tenant-acento"
              }`}
            >
              <span className="text-xs opacity-70">{hoje ? "Hoje" : formatarDiaSemana(dia)}</span>
              <span className="font-medium tabular-nums">{Number(dia.slice(8, 10))}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setMostrarCalendario((v) => !v)}
        className="w-fit text-xs text-current underline opacity-70 hover:opacity-100"
      >
        {mostrarCalendario ? "Ocultar calendário" : "Escolher outra data"}
      </button>
      {mostrarCalendario && (
        <Input
          type="date"
          value={value}
          min={min}
          onChange={(e) => escolherOutraData(e.target.value)}
          className="w-fit"
        />
      )}
    </div>
  );
}
