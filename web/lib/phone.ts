const E164_BR = /^\+55\d{10,11}$/;

/** Normaliza um telefone brasileiro (com ou sem DDI/formatação) para E.164, ou null se inválido. */
export function normalizePhoneBR(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  let withCountryCode: string;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    withCountryCode = digits;
  } else if (digits.length === 10 || digits.length === 11) {
    withCountryCode = `55${digits}`;
  } else {
    return null;
  }

  const e164 = `+${withCountryCode}`;
  return E164_BR.test(e164) ? e164 : null;
}

export function formatPhoneBR(e164: string): string {
  const digits = e164.replace(/\D/g, "").replace(/^55/, "");
  const ddd = digits.slice(0, 2);
  const resto = digits.slice(2);
  if (resto.length === 9) {
    return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
  }
  return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
}
