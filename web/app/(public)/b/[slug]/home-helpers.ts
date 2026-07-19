export type Endereco = {
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
};

export function formatarEndereco(valor: unknown): string | null {
  if (!valor || typeof valor !== "object") return null;
  const e = valor as Endereco;
  const linha1 = [e.rua, e.numero].filter(Boolean).join(", ");
  const linha2 = [e.bairro, [e.cidade, e.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
  const linhas = [linha1, linha2].filter(Boolean);
  return linhas.length > 0 ? linhas.join("\n") : null;
}

export function linkWhatsApp(telefoneE164: string | null): string | null {
  if (!telefoneE164) return null;
  const digitos = telefoneE164.replace(/\D/g, "");
  return digitos ? `https://wa.me/${digitos}` : null;
}
