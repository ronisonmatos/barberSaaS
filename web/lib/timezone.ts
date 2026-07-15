/** Data (YYYY-MM-DD) de "agora" no timezone informado. */
export function hojeNaTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/** A qual data local (YYYY-MM-DD) um timestamp ISO corresponde, no timezone informado. */
export function dataLocal(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
}

function offsetMinutos(dateStr: string, timeZone: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(`${dateStr}T12:00:00Z`));
  const nomeOffset = partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = nomeOffset.match(/GMT([+-]\d+)(?::?(\d+))?/);
  if (!match) return 0;
  const horas = Number.parseInt(match[1], 10);
  const minutos = match[2] ? Number.parseInt(match[2], 10) : 0;
  return horas * 60 + (horas < 0 ? -minutos : minutos);
}

/** Início/fim (UTC) do dia local `dateStr` (YYYY-MM-DD) no timezone informado. */
export function limitesDoDiaUTC(dateStr: string, timeZone: string): { inicio: Date; fim: Date } {
  const offset = offsetMinutos(dateStr, timeZone);
  const inicio = new Date(`${dateStr}T00:00:00Z`);
  inicio.setUTCMinutes(inicio.getUTCMinutes() - offset);
  const fim = new Date(inicio);
  fim.setUTCDate(fim.getUTCDate() + 1);
  return { inicio, fim };
}

/** Domingo (dia 0) da semana que contém dateStr, no timezone informado. */
export function inicioDaSemana(dateStr: string): string {
  const [ano, mes, dia] = dateStr.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() - data.getUTCDay());
  return data.toISOString().slice(0, 10);
}

export function somarDias(dateStr: string, dias: number): string {
  const [ano, mes, dia] = dateStr.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}
