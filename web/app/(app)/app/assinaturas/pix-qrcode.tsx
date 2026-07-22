"use client";

import { Button } from "@/components/ui/button";

/** Exibição do QR Pix (compartilhada entre cadastro de cliente VIP e renovação manual). */
export function PixQrCode({
  qrCode,
  qrCodeBase64,
  mensagemExtra,
  onFechar,
}: {
  qrCode: string;
  qrCodeBase64: string;
  mensagemExtra?: string;
  onFechar: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-center text-sm">
      <p className="font-medium">Peça pro cliente pagar o Pix para confirmar</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem base64 gerada em runtime, sem otimização aplicável */}
      <img
        src={`data:image/png;base64,${qrCodeBase64}`}
        alt="QR code Pix"
        className="h-56 w-56 rounded-md border border-linha"
      />
      <textarea
        readOnly
        value={qrCode}
        onClick={(e) => e.currentTarget.select()}
        rows={3}
        className="w-full rounded-md border border-linha bg-marfim p-2 text-xs text-carvao"
      />
      <p className="text-xs text-cinza-600">
        Confirmamos automaticamente assim que o pagamento cair.{mensagemExtra ? ` ${mensagemExtra}` : ""} Pode
        deixar essa tela aberta ou voltar depois em Assinaturas.
      </p>
      <Button type="button" variant="secondary" onClick={onFechar}>
        Fechar
      </Button>
    </div>
  );
}
