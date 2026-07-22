"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { normalizePhoneBR } from "@/lib/phone";
import { gerarCobrancaPixAssinatura } from "@/lib/assinatura-cobranca";
import {
  parseHorarioFixoFormData,
  validarHorarioFixo,
  upsertHorarioFixo,
  type Regra,
  type HorarioFixoInput,
} from "@/lib/horario-fixo";

const schema = z.object({
  planoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Informe o nome do cliente." }),
  telefone: z.string().min(1, { error: "Informe o telefone do cliente." }),
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function cadastrarClienteVipPix(formData: FormData): Promise<{
  error?: string;
  assinaturaId?: string;
  pagamentoId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}> {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();

  const parsed = schema.safeParse({
    planoId: formData.get("planoId"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "Telefone inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();

  // Já configurando horário fixo junto? Valida TUDO antes de criar a assinatura/cobrança de
  // verdade -- evita gerar um Pix real pra uma configuração que nem passaria na validação.
  const incluirHorarioFixo = formData.get("incluirHorarioFixo") === "on";
  let horarioFixoDados: HorarioFixoInput | undefined;
  if (incluirHorarioFixo) {
    const parsedHorario = parseHorarioFixoFormData(formData);
    if (!parsedHorario.success) {
      return { error: parsedHorario.error.issues[0]?.message ?? "Dados do horário fixo inválidos." };
    }
    horarioFixoDados = parsedHorario.data;

    const { data: plano } = await supabase
      .from("planos_estabelecimento")
      .select("regras")
      .eq("id", parsed.data.planoId)
      .eq("estabelecimento_id", estabelecimento.id)
      .maybeSingle();
    const regrasDoPlano = (plano?.regras as Regra[] | null) ?? [];

    const validacao = await validarHorarioFixo(supabase, {
      estabelecimentoId: estabelecimento.id,
      papel,
      userId,
      assinaturaClienteId: null,
      horarioFixoIdAtual: null,
      regrasDoPlano,
      dados: horarioFixoDados,
    });
    if (validacao.error) return validacao;
  }

  const resultado = await gerarCobrancaPixAssinatura(supabase, {
    estabelecimentoId: estabelecimento.id,
    planoId: parsed.data.planoId,
    nome: parsed.data.nome,
    telefone,
    email: parsed.data.email,
  });
  if (resultado.error || !resultado.assinaturaId) return resultado;

  if (horarioFixoDados) {
    await upsertHorarioFixo(supabase, {
      estabelecimentoId: estabelecimento.id,
      assinaturaClienteId: resultado.assinaturaId,
      horarioFixoId: null,
      dados: horarioFixoDados,
    });
  }

  revalidatePath("/app/assinaturas");
  return resultado;
}

export async function statusAssinaturaVip(pagamentoId: string): Promise<{
  pagamentoStatus: string;
  assinaturaStatus: string | null;
}> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("status, assinatura_cliente_id")
    .eq("id", pagamentoId)
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();
  if (!pagamento) return { pagamentoStatus: "desconhecido", assinaturaStatus: null };

  let assinaturaStatus: string | null = null;
  if (pagamento.assinatura_cliente_id) {
    const { data: assinatura } = await supabase
      .from("assinaturas_clientes")
      .select("status")
      .eq("id", pagamento.assinatura_cliente_id)
      .maybeSingle();
    assinaturaStatus = assinatura?.status ?? null;
  }

  return { pagamentoStatus: pagamento.status, assinaturaStatus };
}
