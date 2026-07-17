import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Alvo do link de convite/recuperação enviado por e-mail (Supabase Auth). Verifica o
// token_hash server-side e estabelece a sessão via cookie antes de redirecionar --
// padrão recomendado para apps SSR com @supabase/ssr (evita depender do fragmento #access_token
// da URL, que não chega ao servidor). Configurado no template de e-mail do painel do Supabase
// (Authentication > Email Templates), não em código.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/definir-senha";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?erro=convite_invalido", request.url));
}
