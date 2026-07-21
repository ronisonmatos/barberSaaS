"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { encerrarModoSuporte, getEstabelecimentoImpersonado } from "@/lib/modo-suporte";

export async function sairDoModoSuporte() {
  const supabase = await createClient();
  const estabelecimentoId = await getEstabelecimentoImpersonado();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await encerrarModoSuporte();

  if (user && estabelecimentoId) {
    await supabase.from("eventos_admin").insert({
      estabelecimento_id: estabelecimentoId,
      super_admin_id: user.id,
      tipo: "modo_suporte_encerrado",
      detalhes: {},
    });
  }

  redirect(estabelecimentoId ? `/admin/estabelecimentos/${estabelecimentoId}` : "/admin");
}
