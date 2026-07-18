import type { Database } from "@/lib/supabase/types";

type Plano = Database["public"]["Tables"]["planos_plataforma"]["Row"];
type AssinaturaAtual = {
  plano_plataforma_id: string;
  preco_promocional_centavos: number | null;
  preco_promocional_ate: string | null;
} | null;

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Preço promocional do plano hoje (fixo ou calculado a partir do percentual), ou null se o plano
 * não tem promoção configurada. Não considera prazo de adesão — só o valor. */
export function precoPromocionalDoPlano(plano: Plano): number | null {
  if (!plano.promocao_ativa) return null;
  if (plano.promocao_tipo === "preco_fixo" && plano.promocao_valor_centavos != null) {
    return plano.promocao_valor_centavos;
  }
  if (plano.promocao_tipo === "percentual" && plano.promocao_percentual != null) {
    return Math.round(plano.preco_centavos * (1 - plano.promocao_percentual / 100));
  }
  return null;
}

/** Se uma assinatura NOVA (ou trocando de plano) feita hoje ainda tem direito à promoção. */
export function promocaoValidaParaNovaAssinatura(plano: Plano): boolean {
  if (!plano.promocao_ativa || precoPromocionalDoPlano(plano) == null) return false;
  return !plano.promocao_assinar_ate || hojeISO() <= plano.promocao_assinar_ate;
}

/** Preço a cobrar/exibir agora para este estabelecimento assinar/renovar este plano. */
export function precoVigente(plano: Plano, assinaturaAtual: AssinaturaAtual): number {
  const renovandoMesmoPlano = assinaturaAtual?.plano_plataforma_id === plano.id;
  if (
    renovandoMesmoPlano &&
    assinaturaAtual?.preco_promocional_centavos != null &&
    assinaturaAtual.preco_promocional_ate &&
    hojeISO() <= assinaturaAtual.preco_promocional_ate
  ) {
    return assinaturaAtual.preco_promocional_centavos;
  }
  if (!renovandoMesmoPlano && promocaoValidaParaNovaAssinatura(plano)) {
    return precoPromocionalDoPlano(plano)!;
  }
  return plano.preco_centavos;
}

/** O que gravar em assinaturas_plataforma.preco_promocional_* após uma cobrança confirmada —
 * trava o preço promocional (se concedido nesta cobrança) ou limpa (plano sem promo/expirada). */
export function calcularTravaPromocional(
  plano: Plano,
  assinaturaAnterior: AssinaturaAtual
): { preco_promocional_centavos: number | null; preco_promocional_ate: string | null } {
  const renovandoMesmoPlano = assinaturaAnterior?.plano_plataforma_id === plano.id;

  // Renovação do mesmo plano com trava ainda válida: mantém a trava como estava.
  if (
    renovandoMesmoPlano &&
    assinaturaAnterior?.preco_promocional_centavos != null &&
    assinaturaAnterior.preco_promocional_ate &&
    hojeISO() <= assinaturaAnterior.preco_promocional_ate
  ) {
    return {
      preco_promocional_centavos: assinaturaAnterior.preco_promocional_centavos,
      preco_promocional_ate: assinaturaAnterior.preco_promocional_ate,
    };
  }

  // Assinatura nova (ou troca de plano) elegível: trava uma promoção nova.
  if (!renovandoMesmoPlano && promocaoValidaParaNovaAssinatura(plano)) {
    const ate = new Date();
    if (plano.promocao_duracao_meses != null) {
      ate.setMonth(ate.getMonth() + plano.promocao_duracao_meses);
    } else {
      ate.setFullYear(ate.getFullYear() + 100); // sem duração = "pra sempre"
    }
    return {
      preco_promocional_centavos: precoPromocionalDoPlano(plano),
      preco_promocional_ate: ate.toISOString().slice(0, 10),
    };
  }

  return { preco_promocional_centavos: null, preco_promocional_ate: null };
}

export const SUPORTE_LABEL: Record<string, string> = {
  limitado: "Suporte limitado",
  prioritario: "Suporte prioritário",
};

export const FLAG_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  relatorios: "Relatórios",
  pagamento_online: "Pagamento online no agendamento",
};

export function listarRecursos(plano: Plano): string[] {
  const itens: string[] = [
    plano.max_profissionais ? `Até ${plano.max_profissionais} profissionais` : "Profissionais ilimitados",
    plano.max_usuarios ? `Até ${plano.max_usuarios} usuários no painel` : "Usuários ilimitados",
    plano.max_fotos ? `Até ${plano.max_fotos} fotos na página pública` : "Fotos ilimitadas",
  ];
  const recursos = (plano.recursos ?? {}) as Record<string, boolean | string>;
  const { suporte, loja, ...flags } = recursos;
  if (loja === true) {
    itens.push(plano.max_produtos ? `Loja com até ${plano.max_produtos} produtos` : "Loja com produtos ilimitados");
  }
  if (typeof suporte === "string" && SUPORTE_LABEL[suporte]) {
    itens.push(SUPORTE_LABEL[suporte]);
  }
  for (const [chave, ativo] of Object.entries(flags)) {
    if (ativo === true) itens.push(FLAG_LABEL[chave] ?? chave);
  }
  return itens;
}
