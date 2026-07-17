"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { criarCobrancaPix, criarCobrancaCartao } from "@/lib/mercadopago";
import { validarCPF, apenasNumeros } from "@/lib/cpf";
import { confirmarPagamentoPlataforma } from "@/lib/assinatura-plataforma";

async function validarPlano(planoId: string) {
  const supabase = await createClient();
  const { data: plano } = await supabase
    .from("planos_plataforma")
    .select("id, nome, preco_centavos, ativo")
    .eq("id", planoId)
    .maybeSingle();
  if (!plano || !plano.ativo) return null;
  return plano;
}

async function criarPagamentoPendente(
  estabelecimentoId: string,
  planoId: string,
  valorCentavos: number,
  metodo: "pix" | "cartao"
) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("pagamentos_plataforma")
    .insert({
      estabelecimento_id: estabelecimentoId,
      plano_plataforma_id: planoId,
      valor_centavos: valorCentavos,
      metodo,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Falha ao registrar cobrança.");
  return data.id as string;
}

const pixSchema = z.object({ planoId: z.string().uuid() });

export async function criarCobrancaPixPlano(
  input: z.infer<typeof pixSchema>
): Promise<{ error?: string; pagamentoId?: string; qrCode?: string; qrCodeBase64?: string }> {
  const parsed = pixSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar o plano." };

  const plano = await validarPlano(parsed.data.planoId);
  if (!plano) return { error: "Plano não encontrado ou indisponível." };

  const accessToken = process.env.MERCADO_PAGO_PLATFORM_ACCESS_TOKEN;
  if (!accessToken) return { error: "Pagamento de assinatura ainda não configurado pela plataforma." };

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user?.email) return { error: "E-mail da conta não encontrado." };

  const pagamentoId = await criarPagamentoPendente(estabelecimento.id, plano.id, plano.preco_centavos, "pix");

  try {
    const cobranca = await criarCobrancaPix({
      accessToken,
      idempotencyKey: pagamentoId,
      valorCentavos: plano.preco_centavos,
      descricao: `Assinatura Comptus - ${plano.nome}`,
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
  planoId: z.string().uuid(),
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

export async function criarCobrancaCartaoPlano(
  input: z.infer<typeof cartaoSchema>
): Promise<{ error?: string; confirmado?: boolean; pagamentoId?: string }> {
  const parsed = cartaoSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  if (!validarCPF(parsed.data.cpf)) return { error: "CPF inválido." };

  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar o plano." };

  const plano = await validarPlano(parsed.data.planoId);
  if (!plano) return { error: "Plano não encontrado ou indisponível." };

  const accessToken = process.env.MERCADO_PAGO_PLATFORM_ACCESS_TOKEN;
  if (!accessToken) return { error: "Pagamento de assinatura ainda não configurado pela plataforma." };

  const pagamentoId = await criarPagamentoPendente(estabelecimento.id, plano.id, plano.preco_centavos, "cartao");
  const supabase = createServiceRoleClient();

  try {
    const cobranca = await criarCobrancaCartao({
      accessToken,
      idempotencyKey: pagamentoId,
      valorCentavos: plano.preco_centavos,
      descricao: `Assinatura Comptus - ${plano.nome}`,
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
      await confirmarPagamentoPlataforma(supabase, {
        id: pagamentoId,
        estabelecimento_id: estabelecimento.id,
        plano_plataforma_id: plano.id,
      });
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

export async function statusPagamentoPlano(pagamentoId: string): Promise<{ status: string } | null> {
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
