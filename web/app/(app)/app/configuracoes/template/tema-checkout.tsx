"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { CardPaymentBrick } from "@/components/payment/card-payment-brick";
import { formatarCPF, apenasNumeros } from "@/lib/cpf";
import { criarCobrancaPixTema, criarCobrancaCartaoTema, statusPagamentoTema } from "./actions";

type Passo = "metodo" | "pix" | "cartao";

export function TemaCheckout({
  temaId,
  temaNome,
  valorCentavos,
  publicKey,
  email,
  onFechar,
}: {
  temaId: string;
  temaNome: string;
  valorCentavos: number;
  publicKey: string | null;
  email: string;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [passo, setPasso] = useState<Passo>("metodo");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cpf, setCpf] = useState("");
  const [pix, setPix] = useState<{ pagamentoId: string; qrCode: string; qrCodeBase64: string } | null>(null);
  const [pagamentoIdPendente, setPagamentoIdPendente] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    const pendente = pix?.pagamentoId ?? pagamentoIdPendente;
    if (!pendente || confirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await statusPagamentoTema(pendente);
      if (!ignorar && status?.status === "pago") setConfirmado(true);
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [pix, pagamentoIdPendente, confirmado]);

  if (confirmado) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-linha bg-marfim p-4 text-center">
        <p className="font-medium text-carvao">Template comprado!</p>
        <p className="text-sm text-cinza-600">Template {temaNome} liberado — já pode aplicá-lo abaixo.</p>
        <Button
          onClick={() => {
            router.refresh();
            onFechar();
          }}
        >
          Fechar
        </Button>
      </div>
    );
  }

  if (passo === "pix" && pix) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-linha bg-marfim p-4 text-center">
        <p className="font-medium text-carvao">Pague com Pix para liberar o template {temaNome}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem base64 gerada em runtime */}
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR code Pix"
          className="h-56 w-56 rounded-md border border-linha"
        />
        <textarea
          readOnly
          value={pix.qrCode}
          onClick={(e) => e.currentTarget.select()}
          rows={3}
          className="w-full rounded-md border border-linha bg-marfim-2 p-2 text-xs text-carvao"
        />
        <p className="text-sm text-cinza-600">Confirmamos automaticamente assim que o pagamento cair.</p>
        <Button variant="ghost" onClick={onFechar}>
          Cancelar
        </Button>
      </div>
    );
  }

  if (passo === "cartao") {
    if (!publicKey) {
      return (
        <div className="rounded-md border border-linha bg-marfim p-4">
          <FormError>Pagamento com cartão ainda não configurado pela plataforma.</FormError>
          <Button variant="ghost" onClick={onFechar} className="mt-2">
            Voltar
          </Button>
        </div>
      );
    }
    const cpfValido = apenasNumeros(cpf).length === 11;
    return (
      <div className="flex flex-col gap-3 rounded-md border border-linha bg-marfim p-4">
        <Input
          placeholder="CPF do responsável"
          value={cpf}
          onChange={(e) => setCpf(formatarCPF(e.target.value))}
        />
        {erro && <FormError>{erro}</FormError>}
        {cpfValido && (
          <CardPaymentBrick
            publicKey={publicKey}
            valorCentavos={valorCentavos}
            email={email}
            cpf={apenasNumeros(cpf)}
            onEnviar={async (formData) => {
              const r = await criarCobrancaCartaoTema({ temaId, cpf, formData });
              if (r.error) return { error: r.error };
              if (r.pagamentoId) setPagamentoIdPendente(r.pagamentoId);
              return { confirmado: r.confirmado };
            }}
            onResultado={(r) => {
              if (r.error) setErro(r.error);
              if (r.confirmado) setConfirmado(true);
            }}
          />
        )}
        <Button variant="ghost" onClick={onFechar}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-linha bg-marfim p-4">
      {erro && <FormError>{erro}</FormError>}
      <div className="flex gap-2">
        <Button
          disabled={pending}
          onClick={() => {
            setErro(null);
            startTransition(async () => {
              const r = await criarCobrancaPixTema({ temaId });
              if (r.error || !r.pagamentoId || !r.qrCode || !r.qrCodeBase64) {
                setErro(r.error ?? "Erro ao gerar Pix.");
                return;
              }
              setPix({ pagamentoId: r.pagamentoId, qrCode: r.qrCode, qrCodeBase64: r.qrCodeBase64 });
              setPasso("pix");
            });
          }}
        >
          {pending ? "Gerando..." : "Pagar com Pix"}
        </Button>
        <Button variant="secondary" onClick={() => setPasso("cartao")}>
          Pagar com cartão
        </Button>
      </div>
      <Button variant="ghost" onClick={onFechar}>
        Cancelar
      </Button>
    </div>
  );
}
