function calcularDigito(digitos: string, peso: number): number {
  const soma = digitos
    .split("")
    .reduce((acc, digito, i) => acc + Number.parseInt(digito, 10) * (peso - i), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** Valida CPF (formato + dígitos verificadores). Aceita com ou sem pontuação. */
export function validarCPF(input: string): boolean {
  const cpf = input.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito1 = calcularDigito(cpf.slice(0, 9), 10);
  const digito2 = calcularDigito(cpf.slice(0, 9) + digito1, 11);

  return cpf === cpf.slice(0, 9) + digito1 + digito2;
}

export function formatarCPF(input: string): string {
  const cpf = input.replace(/\D/g, "").slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function apenasNumeros(input: string): string {
  return input.replace(/\D/g, "");
}
