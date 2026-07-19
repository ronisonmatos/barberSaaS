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

/** Formata centavos pro valor inicial (defaultValue) de um campo de preço, ex: "40,00" --
 * precisa usar vírgula (não `.toFixed(2)`, que usa ponto) porque brlToCentavos() acima trata
 * ponto como separador de milhar. Se o campo for reenviado sem o usuário editá-lo (ex: salvou
 * outro campo do mesmo formulário), o valor tem que voltar exatamente igual, senão cada resubmit
 * infla o preço (o ponto do toFixed vira "separador de milhar" e multiplica por ~100). */
export function centavosParaCampoBRL(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}
