import Link from "next/link";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { gerarQrCodeDataUrl } from "@/lib/qrcode";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { VoltarConfiguracoes } from "../voltar-link";

export default async function CheckinConfigPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();

  const urlCheckin = `${process.env.NEXT_PUBLIC_APP_URL}/b/${estabelecimento.slug}/checkin`;
  const qrCodeCheckin = await gerarQrCodeDataUrl(urlCheckin);

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Check-in por QR Code</Heading>
      <Card className="flex flex-wrap items-start gap-4 p-4">
        <div className="flex-1">
          <p className="text-sm text-cinza-600">
            Imprima ou deixe esse QR Code numa tela no balcão. O cliente escaneia, digita o WhatsApp
            usado no agendamento e confirma a chegada sozinho — sem precisar avisar o profissional.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={qrCodeCheckin} download="qrcode-checkin.png">
              <Button variant="secondary">Baixar QR Code</Button>
            </a>
            <Link href={urlCheckin} target="_blank">
              <Button variant="secondary">Abrir tela de check-in</Button>
            </Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerada no servidor, next/image não se aplica */}
        <img
          src={qrCodeCheckin}
          alt="QR Code de check-in"
          width={160}
          height={160}
          className="rounded-md border border-linha"
        />
      </Card>
    </div>
  );
}
