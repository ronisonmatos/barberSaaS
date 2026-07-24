import { hojeNaTimezone, somarDias, limitesDoDiaUTC } from "@/lib/timezone";

export const PERIODOS = {
  hoje: { label: "Hoje", dias: 1 },
  "7d": { label: "7 dias", dias: 7 },
  "30d": { label: "30 dias", dias: 30 },
} as const;

export type PeriodoKey = keyof typeof PERIODOS;

export function periodoValido(valor: string | undefined): PeriodoKey {
  return valor && valor in PERIODOS ? (valor as PeriodoKey) : "30d";
}

export function calcularRangePeriodo(periodo: PeriodoKey, timezone: string) {
  const hoje = hojeNaTimezone(timezone);
  const primeiroDia = somarDias(hoje, -(PERIODOS[periodo].dias - 1));
  const rangeInicio = limitesDoDiaUTC(primeiroDia, timezone).inicio;
  const rangeFim = limitesDoDiaUTC(hoje, timezone).fim;
  return { hoje, primeiroDia, rangeInicio, rangeFim };
}
