"use server";

import { createClient } from "@/lib/supabase/server";

export async function cancelarAgendamento(
  token: string,
  agendamentoId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_agendamento_via_token", {
    p_token: token,
    p_agendamento_id: agendamentoId,
  });
  if (error) return { error: error.message };

  return {};
}
