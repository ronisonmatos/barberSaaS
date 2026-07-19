"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { criarCobrancaPix, criarCobrancaCartao } from "@/lib/mercadopago";
import { validarCPF, apenasNumeros } from "@/lib/cpf";
import { confirmarCompraTema } from "@/lib/tema-plataforma";

const LAYOUTS_GRATIS = ["classico"];

const schemaTemplate = z.object({ layout: z.string().min(1) });

export async function salvarTemplate(input: z.infer<typeof schemaTemplate>): Promise<{ error?: string }> {
  const parsed = schemaTemplate.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar o template." };

  const supabase = await createClient();

  // Defesa em profundidade: a UI já esconde templates pagos não comprados, mas o servidor
  // nunca confia só nisso (mesmo padrão dos gates de loja/pagamento online).
  if (!LAYOUTS_GRATIS.includes(parsed.data.layout)) {
    const { data: tema } = await supabase
      .from("temas_plataforma")
      .select("id, gratis")
      .eq("chave", parsed.data.layout)
      .maybeSingle();
    if (!tema) return { error: "Template inválido." };

    if (!tema.gratis) {
      const { data: comprado } = await supabase
        .from("estabelecimento_temas_comprados")
        .select("id")
        .eq("estabelecimento_id", estabelecimento.id)
        .eq("tema_plataforma_id", tema.id)
        .maybeSingle();
      if (!comprado) return { error: "Esse template ainda não foi comprado." };
    }
  }

  const configAtual = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const { error } = await supabase
    .from("estabelecimentos")
    .update({ config: { ...configAtual, layout: parsed.data.layout } })
    .eq("id", estabelecimento.id);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes/template");
  revalidatePath(`/b/${estabelecimento.slug}`);
  return {};
}

async function validarTema(temaId: string) {
  const supabase = await createClient();
  const { data: tema } = await supabase
    .from("temas_plataforma")
    .select("*")
    .eq("id", temaId)
    .maybeSingle();
  if (!tema || !tema.ativo) return null;
  return tema;
}

async function criarPagamentoTemaPendente(
  estabelecimentoId: string,
  temaId: string,
  valorCentavos: number,
  metodo: "pix" | "cartao"
) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("pagamentos_plataforma")
    .insert({
      estabelecimento_id: estabelecimentoId,
      tema_plataforma_id: temaId,
      valor_centavos: valorCentavos,
      metodo,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Falha ao registrar cobrança.");
  return data.id as string;
}

const pixSchema = z.object({ temaId: z.string().min(1) });

export async function criarCobrancaPixTema(
  input: z.infer<typeof pixSchema>
): Promise<{ error?: string; pagamentoId?: string; qrCode?: string; qrCodeBase64?: string }> {
  const parsed = pixSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode comprar um template." };

  const tema = await validarTema(parsed.data.temaId);
  if (!tema) return { error: "Template não encontrado ou indisponível." };

  const accessToken = process.env.MERCADO_PAGO_PLATFORM_ACCESS_TOKEN;
  if (!accessToken) return { error: "Pagamento ainda não configurado pela plataforma." };

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user?.email) return { error: "E-mail da conta não encontrado." };

  const pagamentoId = await criarPagamentoTemaPendente(estabelecimento.id, tema.id, tema.preco_centavos, "pix");

  try {
    const cobranca = await criarCobrancaPix({
      accessToken,
      idempotencyKey: pagamentoId,
      valorCentavos: tema.preco_centavos,
      descricao: `Template Comptus - ${tema.nome}`,
      emailPagador: user.email,
    });
    const supabase = createServiceRoleClient();
    await supabase
      .from("pagamentos_plataforma")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", pagamentoId);
    return { pagamentoId, qrCode: cobranca.qrCode, qrCodeBase64: cobranca.qrCodeBase64 };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao gerar cobrança Pix." };
  }
}

const cartaoSchema = z.object({
  temaId: z.string().min(1),
  cpf: z.string().min(11),
  formData: z.object({
    token: z.string(),
    payment_method_id: z.string(),
    issuer_id: z.string().optional(),
    installments: z.number(),
    payer: z.object({
      email: z.string(),
      identification: z.object({ type: z.string(), number: z.string() }),
    }),
  }),
});

export async function criarCobrancaCartaoTema(
  input: z.infer<typeof cartaoSchema>
): Promise<{ error?: string; confirmado?: boolean; pagamentoId?: string }> {
  const parsed = cartaoSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  if (!validarCPF(parsed.data.cpf)) return { error: "CPF inválido." };

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode comprar um template." };

  const tema = await validarTema(parsed.data.temaId);
  if (!tema) return { error: "Template não encontrado ou indisponível." };

  const accessToken = process.env.MERCADO_PAGO_PLATFORM_ACCESS_TOKEN;
  if (!accessToken) return { error: "Pagamento ainda não configurado pela plataforma." };

  const pagamentoId = await criarPagamentoTemaPendente(estabelecimento.id, tema.id, tema.preco_centavos, "cartao");
  const supabase = createServiceRoleClient();

  try {
    const cobranca = await criarCobrancaCartao({
      accessToken,
      idempotencyKey: pagamentoId,
      valorCentavos: tema.preco_centavos,
      descricao: `Template Comptus - ${tema.nome}`,
      formData: {
        ...parsed.data.formData,
        payer: {
          ...parsed.data.formData.payer,
          identification: { type: "CPF", number: apenasNumeros(parsed.data.cpf) },
        },
      },
    });

    await supabase
      .from("pagamentos_plataforma")
      .update({ gateway_payment_id: cobranca.paymentId })
      .eq("id", pagamentoId);

    if (cobranca.status === "approved") {
      await confirmarCompraTema(supabase, {
        id: pagamentoId,
        estabelecimento_id: estabelecimento.id,
        tema_plataforma_id: tema.id,
      });
      revalidatePath("/app/configuracoes/template");
      return { confirmado: true, pagamentoId };
    }
    if (["rejected", "cancelled"].includes(cobranca.status)) {
      await supabase.from("pagamentos_plataforma").update({ status: "falhou" }).eq("id", pagamentoId);
      return { error: "Pagamento recusado pelo cartão." };
    }
    return { pagamentoId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao processar cartão." };
  }
}

export async function statusPagamentoTema(pagamentoId: string): Promise<{ status: string } | null> {
  const { papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pagamentos_plataforma")
    .select("status")
    .eq("id", pagamentoId)
    .maybeSingle();
  return data ? { status: data.status } : null;
}
