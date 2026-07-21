import "server-only";
import { cookies } from "next/headers";

const COOKIE = "comptus_modo_suporte";
const DURACAO_SEGUNDOS = 60 * 60;

export async function iniciarModoSuporte(estabelecimentoId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, estabelecimentoId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function encerrarModoSuporte() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function getEstabelecimentoImpersonado(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE)?.value ?? null;
}
