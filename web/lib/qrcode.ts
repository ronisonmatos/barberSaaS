import "server-only";
import QRCode from "qrcode";

export async function gerarQrCodeDataUrl(conteudo: string): Promise<string> {
  return QRCode.toDataURL(conteudo, { margin: 1, width: 320 });
}
