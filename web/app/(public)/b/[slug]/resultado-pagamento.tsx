import Link from "next/link";
import { Heading } from "@/components/ui/heading";
import { BOTAO_GHOST } from "./estilos";

/**
 * Telas de resultado de pagamento (QR Pix / processando cartão / confirmado), compartilhadas
 * entre o wizard de agendar e o wizard da loja -- só muda o texto de confirmação e o link final.
 */
export function ResultadoPagamento({
  confirmado,
  pix,
  linkHref,
  linkLabel,
  tituloConfirmado,
  mensagemConfirmado,
}: {
  confirmado: boolean;
  pix: { qrCode: string; qrCodeBase64: string } | null;
  linkHref: string;
  linkLabel: string;
  tituloConfirmado: string;
  mensagemConfirmado: string;
}) {
  if (confirmado) {
    return (
      <div className="flex flex-col gap-3">
        <Heading className="text-tenant-fg">{tituloConfirmado}</Heading>
        <p className="text-tenant-fg opacity-80">{mensagemConfirmado}</p>
        <Link href={linkHref} className={BOTAO_GHOST}>
          {linkLabel}
        </Link>
      </div>
    );
  }

  if (pix) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Heading className="text-tenant-fg">Pague com Pix para confirmar</Heading>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem base64 gerada em runtime, sem otimização aplicável */}
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR code Pix"
          className="h-56 w-56 rounded-md border border-tenant-linha"
        />
        <textarea
          readOnly
          value={pix.qrCode}
          onClick={(e) => e.currentTarget.select()}
          rows={3}
          className="w-full rounded-md border border-tenant-linha bg-tenant-bg p-2 text-xs text-tenant-fg"
        />
        <p className="text-sm text-tenant-fg opacity-70">
          Copie o código acima ou escaneie o QR code no app do seu banco. Confirmamos automaticamente
          assim que o pagamento cair.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Heading className="text-tenant-fg">Processando pagamento</Heading>
      <p className="text-tenant-fg opacity-80">
        Seu cartão está sendo processado. Assim que aprovado, confirmamos automaticamente.
      </p>
    </div>
  );
}
