import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * O prefixo da propria chave ja indica o ambiente: $aact_prod_... = producao,
 * qualquer outra coisa (ex: $aact_hmlg_...) = sandbox. Nao precisa de toggle na UI.
 * https://docs.asaas.com/docs/autenticacao
 */
function baseUrlAsaas(apiKey: string): string {
  return apiKey.startsWith("$aact_prod_") ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

function headersAsaas(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "User-Agent": "Comptus/1.0",
    access_token: apiKey,
  };
}

type CriarCobrancaPixAsaasInput = {
  apiKey: string;
  valorCentavos: number;
  descricao: string;
  nomePagador: string;
  emailPagador: string;
  cpfPagador: string;
  externalReference: string;
};

type CriarCobrancaPixResultado = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
};

export async function criarCobrancaPixAsaas(input: CriarCobrancaPixAsaasInput): Promise<CriarCobrancaPixResultado> {
  const base = baseUrlAsaas(input.apiKey);
  const headers = headersAsaas(input.apiKey);

  const respostaCliente = await fetch(`${base}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: input.nomePagador,
      cpfCnpj: input.cpfPagador,
      email: input.emailPagador,
      externalReference: input.externalReference,
    }),
  });
  const cliente = await respostaCliente.json();
  if (!respostaCliente.ok) {
    throw new Error(cliente?.errors?.[0]?.description ?? "Falha ao cadastrar cliente na Asaas.");
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const respostaCobranca = await fetch(`${base}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: cliente.id,
      billingType: "PIX",
      value: input.valorCentavos / 100,
      dueDate: hoje,
      description: input.descricao,
      externalReference: input.externalReference,
    }),
  });
  const cobranca = await respostaCobranca.json();
  if (!respostaCobranca.ok) {
    throw new Error(cobranca?.errors?.[0]?.description ?? "Falha ao criar cobrança Pix na Asaas.");
  }

  // Contas sem chave Pix cadastrada dependem de uma chave temporaria de uma instituicao parceira
  // pra gerar o QR code, o que pode levar alguns segundos apos criar a cobranca -- tenta de novo
  // algumas vezes antes de desistir.
  let qrCode: { payload: string; encodedImage: string } | null = null;
  let ultimoErro: string | null = null;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    if (tentativa > 0) await new Promise((resolve) => setTimeout(resolve, 1500));

    const respostaQrCode = await fetch(`${base}/payments/${cobranca.id}/pixQrCode`, { headers });
    const dados = await respostaQrCode.json();
    if (respostaQrCode.ok && dados?.payload && dados?.encodedImage) {
      qrCode = dados;
      break;
    }
    ultimoErro = dados?.errors?.[0]?.description ?? JSON.stringify(dados);
  }

  if (!qrCode) {
    throw new Error(`Asaas não retornou o QR code Pix: ${ultimoErro ?? "resposta vazia"}.`);
  }

  return {
    paymentId: String(cobranca.id),
    qrCode: qrCode.payload,
    qrCodeBase64: qrCode.encodedImage,
  };
}

export async function consultarPagamentoAsaas(
  paymentId: string,
  apiKey: string
): Promise<{ id: string; status: string; billingType: string }> {
  const resposta = await fetch(`${baseUrlAsaas(apiKey)}/payments/${paymentId}`, {
    headers: headersAsaas(apiKey),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados?.errors?.[0]?.description ?? "Falha ao consultar pagamento na Asaas.");
  }
  return { id: String(dados.id), status: dados.status, billingType: dados.billingType };
}

type CriarCheckoutAsaasInput = {
  apiKey: string;
  valorCentavos: number;
  descricao: string;
  externalReference: string;
  successUrl: string;
  cancelUrl: string;
  maxInstallmentCount: number;
  billingTypes: string[];
};

type CriarCheckoutAsaasResultado = {
  checkoutId: string;
  link: string;
};

/**
 * Checkout hospedado pela propria Asaas -- aceita Pix e cartao parcelado nativamente, sem nosso
 * servidor tocar em dado de cartao. Confirmacao continua vindo por webhook (os mesmos eventos de
 * pagamento disparam independente de o pagamento ter nascido aqui ou via /payments direto).
 * https://docs.asaas.com/docs/checkout-asaas
 */
export async function criarCheckoutAsaas(input: CriarCheckoutAsaasInput): Promise<CriarCheckoutAsaasResultado> {
  const resposta = await fetch(`${baseUrlAsaas(input.apiKey)}/checkouts`, {
    method: "POST",
    headers: headersAsaas(input.apiKey),
    body: JSON.stringify({
      billingTypes: input.billingTypes,
      chargeTypes: ["DETACHED", "INSTALLMENT"],
      minutesToExpire: 60,
      installment: { maxInstallmentCount: input.maxInstallmentCount },
      value: input.valorCentavos / 100,
      description: input.descricao,
      externalReference: input.externalReference,
      callback: {
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        expiredUrl: input.cancelUrl,
      },
    }),
  });
  const dados = await resposta.json();
  if (!resposta.ok || !dados?.link) {
    throw new Error(dados?.errors?.[0]?.description ?? "Falha ao criar checkout na Asaas.");
  }
  return { checkoutId: String(dados.id), link: dados.link };
}

export function tokensIguais(recebido: string | null, esperado: string): boolean {
  if (!recebido) return false;
  const bufferRecebido = Buffer.from(recebido);
  const bufferEsperado = Buffer.from(esperado);
  if (bufferRecebido.length !== bufferEsperado.length) return false;
  return timingSafeEqual(bufferRecebido, bufferEsperado);
}
