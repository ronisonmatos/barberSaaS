"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneBR } from "@/lib/phone";

export async function buscarSlotsPublico(
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

const schema = z.object({
  estabelecimentoId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid(),
  inicio: z.string().min(1),
  nome: z.string().trim().min(2, { error: "Informe seu nome." }),
  telefone: z.string().min(1, { error: "Informe seu WhatsApp." }),
});

export async function criarAgendamentoPublico(
  input: z.infer<typeof schema>
): Promise<{ error?: string; agendamentoId?: string; token?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("criar_agendamento_publico", {
      p_estabelecimento_id: parsed.data.estabelecimentoId,
      p_profissional_id: parsed.data.profissionalId,
      p_servico_id: parsed.data.servicoId,
      p_inicio: parsed.data.inicio,
      p_nome: parsed.data.nome,
      p_telefone: telefone,
    })
    .single();

  if (error) return { error: error.message };

  return { agendamentoId: data.agendamento_id, token: data.token_acesso };
}
