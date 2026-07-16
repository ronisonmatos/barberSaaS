export function centavosToBRL(centavos: number): string {
  const semCentavos = centavos % 100 === 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: semCentavos ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

/** Converte uma string de input (ex: "40,00" ou "40.00") em centavos (inteiro). */
export function brlToCentavos(input: string): number {
  const normalizado = input.replace(/\./g, "").replace(",", ".");
  const valor = Number.parseFloat(normalizado);
  return Math.round(valor * 100);
}
