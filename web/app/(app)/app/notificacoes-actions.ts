"use server";

import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacaoLida(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
}
