import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

type CriarCobrancaPixInput = {
  accessToken: string;
  idempotencyKey: string;
  valorCentavos: number;
  descricao: string;
  emailPagador: string;
};

type CriarCobrancaPixResultado = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
};

export async function criarCobrancaPix(input: CriarCobrancaPixInput): Promise<CriarCobrancaPixResultado> {
  const resposta = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: input.valorCentavos / 100,
      description: input.descricao,
      payment_method_id: "pix",
      payer: { email: input.emailPagador },
    }),
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados?.message ?? "Falha ao criar cobrança Pix no Mercado Pago.");
  }

  const transactionData = dados?.point_of_interaction?.transaction_data;
  if (!transactionData?.qr_code || !transactionData?.qr_code_base64) {
    throw new Error("Mercado Pago não retornou o QR code Pix.");
  }

  return {
    paymentId: String(dados.id),
    qrCode: transactionData.qr_code,
    qrCodeBase64: transactionData.qr_code_base64,
  };
}

type FormDataCartaoBrick = {
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
  payer: {
    email: string;
    identification: { type: string; number: string };
  };
};

type CriarCobrancaCartaoResultado = {
  paymentId: string;
  status: string;
};

export async function criarCobrancaCartao(input: {
  accessToken: string;
  idempotencyKey: string;
  valorCentavos: number;
  descricao: string;
  formData: FormDataCartaoBrick;
}): Promise<CriarCobrancaCartaoResultado> {
  const resposta = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: input.valorCentavos / 100,
      description: input.descricao,
      token: input.formData.token,
      payment_method_id: input.formData.payment_method_id,
      issuer_id: input.formData.issuer_id,
      installments: input.formData.installments,
      payer: input.formData.payer,
    }),
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados?.message ?? "Falha ao processar cartão no Mercado Pago.");
  }

  return { paymentId: String(dados.id), status: dados.status };
}

export async function consultarPagamentoMercadoPago(paymentId: string, accessToken: string) {
  const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados?.message ?? "Falha ao consultar pagamento no Mercado Pago.");
  }
  return dados as { id: number; status: string };
}

/**
 * Verifica o header x-signature do webhook do Mercado Pago.
 * Manifesto assinado: `id:{dataId};request-id:{xRequestId};ts:{ts};`
 * https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verificarAssinaturaWebhookMercadoPago({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!xSignature || !xRequestId) return false;

  const partes = new Map(
    xSignature.split(",").map((parte) => {
      const [chave, valor] = parte.split("=");
      return [chave?.trim(), valor?.trim()];
    })
  );
  const ts = partes.get("ts");
  const v1 = partes.get("v1");
  if (!ts || !v1) return false;

  const dataIdNormalizado = /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifesto = `id:${dataIdNormalizado};request-id:${xRequestId};ts:${ts};`;
  const assinaturaCalculada = createHmac("sha256", secret).update(manifesto).digest("hex");

  const bufferCalculado = Buffer.from(assinaturaCalculada, "hex");
  const bufferRecebido = Buffer.from(v1, "hex");
  if (bufferCalculado.length !== bufferRecebido.length) return false;
  return timingSafeEqual(bufferCalculado, bufferRecebido);
}
