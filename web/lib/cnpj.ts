import { apenasNumeros } from "./cpf";

function calcularDigito(digitos: string, pesos: number[]): number {
  const soma = digitos
    .split("")
    .reduce((acc, digito, i) => acc + Number.parseInt(digito, 10) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

const PESOS_DIGITO1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DIGITO2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** Valida CNPJ (formato + dígitos verificadores). Aceita com ou sem pontuação. */
export function validarCNPJ(input: string): boolean {
  const cnpj = apenasNumeros(input);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digito1 = calcularDigito(cnpj.slice(0, 12), PESOS_DIGITO1);
  const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, PESOS_DIGITO2);

  return cnpj === cnpj.slice(0, 12) + digito1 + digito2;
}

export function formatarCNPJ(input: string): string {
  const cnpj = apenasNumeros(input).slice(0, 14);
  return cnpj
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
