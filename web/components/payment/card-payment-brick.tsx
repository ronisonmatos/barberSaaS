"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type FormDataCartaoBrick = {
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
  payer: { email: string; identification: { type: string; number: string } };
};

type ResultadoPagamento = { error?: string; confirmado?: boolean; token?: string; pagamentoId?: string };

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          tipo: "payment",
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

const CONTAINER_ID = "card-payment-brick-container";

export function CardPaymentBrick({
  publicKey,
  valorCentavos,
  email,
  cpf,
  onEnviar,
  onResultado,
}: {
  publicKey: string;
  valorCentavos: number;
  email: string;
  cpf: string;
  onEnviar: (formData: FormDataCartaoBrick) => Promise<ResultadoPagamento>;
  onResultado: (resultado: ResultadoPagamento) => void;
}) {
  const [sdkPronto, setSdkPronto] = useState(false);
  const [brickMontado, setBrickMontado] = useState(false);
  const controllerRef = useRef<{ unmount: () => void } | null>(null);
  const onEnviarRef = useRef(onEnviar);
  const onResultadoRef = useRef(onResultado);
  useEffect(() => {
    onEnviarRef.current = onEnviar;
    onResultadoRef.current = onResultado;
  });

  useEffect(() => {
    if (!sdkPronto || !window.MercadoPago) return;
    let cancelado = false;

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
    mp.bricks()
      .create("payment", CONTAINER_ID, {
        initialization: {
          amount: valorCentavos / 100,
          payer: { email, entityType: "individual", identification: { type: "CPF", number: cpf } },
        },
        customization: {
          paymentMethods: {
            // Só declaramos o que queremos habilitar. Tentar excluir explicitamente os demais
            // (debitCard/ticket/bankTransfer/...: "excluded") quebra no Brasil -- cada método tem
            // seu próprio conjunto de valores válidos (ex: bankTransfer só aceita "pix"), então
            // "excluded" não é universalmente aceito e a API rejeita a inicialização inteira.
            creditCard: "all",
          },
        },
        callbacks: {
          onReady: () => {
            if (!cancelado) setBrickMontado(true);
          },
          onSubmit: ({ formData }: { formData: FormDataCartaoBrick }) => {
            return new Promise<void>((resolve, reject) => {
              onEnviarRef.current(formData).then((resultado) => {
                onResultadoRef.current(resultado);
                if (resultado.error) reject();
                else resolve();
              });
            });
          },
          onError: () => {
            onResultadoRef.current({ error: "Não foi possível carregar o formulário de cartão." });
          },
        },
      })
      .then((controller) => {
        if (!cancelado) controllerRef.current = controller;
      });

    return () => {
      cancelado = true;
      controllerRef.current?.unmount();
    };
  }, [sdkPronto, publicKey, valorCentavos, email, cpf]);

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" onReady={() => setSdkPronto(true)} />
      {!brickMontado && <p className="text-sm text-tenant-fg opacity-70">Carregando formulário de pagamento...</p>}
      <div id={CONTAINER_ID} />
    </>
  );
}
