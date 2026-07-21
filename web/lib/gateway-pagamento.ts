import "server-only";
import { criarCobrancaPix } from "@/lib/mercadopago";
import { criarCobrancaPixAsaas } from "@/lib/asaas";
import { validarCPF, apenasNumeros } from "@/lib/cpf";

type ConfigGatewayPagamento = {
  gateway_ativo: string;
  mercado_pago_access_token: string | null;
  asaas_api_key: string | null;
};

type CriarCobrancaPixGatewayInput = {
  idempotencyKey: string;
  valorCentavos: number;
  descricao: string;
  nomePagador: string;
  emailPagador: string;
  cpfPagador?: string;
};

type CriarCobrancaPixResultado = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
};

/**
 * Decide qual gateway usar pra gerar a cobranca Pix a partir de estabelecimento_pagamento_config.
 * Cartao continua exclusivo da Mercado Pago -- essa funcao so cobre Pix.
 */
export async function criarCobrancaPixGateway(
  config: ConfigGatewayPagamento,
  input: CriarCobrancaPixGatewayInput
): Promise<CriarCobrancaPixResultado> {
  if (config.gateway_ativo === "mercado_pago") {
    if (!config.mercado_pago_access_token) {
      throw new Error("Configuração de pagamento indisponível.");
    }
    return criarCobrancaPix({
      accessToken: config.mercado_pago_access_token,
      idempotencyKey: input.idempotencyKey,
      valorCentavos: input.valorCentavos,
      descricao: input.descricao,
      emailPagador: input.emailPagador,
    });
  }

  if (config.gateway_ativo === "asaas") {
    if (!config.asaas_api_key) {
      throw new Error("Configuração de pagamento indisponível.");
    }
    if (!input.cpfPagador || !validarCPF(input.cpfPagador)) {
      throw new Error("CPF inválido. A Asaas exige um CPF válido para gerar a cobrança.");
    }
    return criarCobrancaPixAsaas({
      apiKey: config.asaas_api_key,
      valorCentavos: input.valorCentavos,
      descricao: input.descricao,
      nomePagador: input.nomePagador,
      emailPagador: input.emailPagador,
      cpfPagador: apenasNumeros(input.cpfPagador),
      externalReference: input.idempotencyKey,
    });
  }

  throw new Error("Configuração de pagamento indisponível.");
}
