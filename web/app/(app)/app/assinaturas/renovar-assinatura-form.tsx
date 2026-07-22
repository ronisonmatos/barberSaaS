"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renovarAssinaturaPix } from "./actions-renovacao";
import { statusAssinaturaVip } from "./actions-cadastro-vip";
import { PixQrCode } from "./pix-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

export function RenovarAssinaturaForm({
  assinaturaId,
  clienteNome,
  clienteTelefone,
  clienteEmail,
  onDone,
}: {
  assinaturaId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<{ pagamentoId: string; qrCode: string; qrCodeBase64: string } | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!pix || confirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await statusAssinaturaVip(pix.pagamentoId);
      if (!ignorar && status.assinaturaStatus === "ativa") {
        setConfirmado(true);
        router.refresh();
      }
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [pix, confirmado, router]);

  function enviar(formData: FormData) {
    setErro(null);
    formData.set("assinaturaId", assinaturaId);
    startTransition(async () => {
      const r = await renovarAssinaturaPix(formData);
      if (r.error || !r.qrCode || !r.qrCodeBase64 || !r.pagamentoId) {
        setErro(r.error ?? "Erro ao gerar cobrança Pix.");
        return;
      }
      setPix({ pagamentoId: r.pagamentoId, qrCode: r.qrCode, qrCodeBase64: r.qrCodeBase64 });
    });
  }

  if (confirmado) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
        <p className="font-medium text-sucesso">Pagamento confirmado! Assinatura renovada por mais 30 dias.</p>
        <Button type="button" onClick={onDone}>
          Fechar
        </Button>
      </div>
    );
  }

  if (pix) {
    return <PixQrCode qrCode={pix.qrCode} qrCodeBase64={pix.qrCodeBase64} onFechar={onDone} />;
  }

  return (
    <form action={enviar} className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="font-medium">Nome do cliente</label>
          <Input name="nome" defaultValue={clienteNome} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Telefone (WhatsApp)</label>
          <Input name="telefone" defaultValue={clienteTelefone} required />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-medium">E-mail</label>
          <Input type="email" name="email" defaultValue={clienteEmail} required />
        </div>
      </div>

      <p className="text-xs text-cinza-600">
        Gera uma nova cobrança Pix pra renovar essa assinatura pelo mesmo plano, por mais 30 dias.
        Confira os dados do cliente antes de enviar (edite se precisar corrigir algo).
      </p>

      {erro && <FormError>{erro}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Gerando cobrança..." : "Gerar cobrança de renovação"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
