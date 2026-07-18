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

export async function buscarSlotsParaRemarcar(
  estabelecimentoId: string,
  profissionalId: string,
  servicoId: string,
  data: string
) {
  const supabase = await createClient();
  const { data: slots, error } = await supabase.rpc("slots_disponiveis", {
    p_estabelecimento_id: estabelecimentoId,
    p_profissional_id: profissionalId,
    p_servico_id: servicoId,
    p_data: data,
  });
  if (error) return [];
  return slots ?? [];
}

export async function remarcarAgendamento(
  token: string,
  agendamentoId: string,
  novoInicio: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remarcar_agendamento_via_token", {
    p_token: token,
    p_agendamento_id: agendamentoId,
    p_novo_inicio: novoInicio,
  });
  if (error) {
    if (error.message.includes("fora do prazo")) {
      return { error: "Fora do prazo pra remarcar sozinho. Entre em contato com o estabelecimento." };
    }
    if (error.message.includes("indisponivel")) {
      return { error: "Esse horário não está mais disponível." };
    }
    return { error: error.message };
  }

  return {};
}
