"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneBR } from "@/lib/phone";
import type { FidelidadeStatusPublico } from "../cartao-fidelidade";

export type AgendamentoCheckin = {
  agendamentoId: string;
  inicio: string;
  servicoNome: string;
  profissionalNome: string;
  jaChegou: boolean;
};

const buscarSchema = z.object({
  estabelecimentoId: z.string().uuid(),
  telefone: z.string().min(1, { error: "Informe seu WhatsApp." }),
});

export async function buscarAgendamentosCheckin(
  input: z.infer<typeof buscarSchema>
): Promise<{ error?: string; agendamentos?: AgendamentoCheckin[] }> {
  const parsed = buscarSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkin_buscar_agendamentos_publico", {
    p_estabelecimento_id: parsed.data.estabelecimentoId,
    p_telefone: telefone,
  });

  if (error) return { error: error.message };

  const agendamentos: AgendamentoCheckin[] = (data ?? []).map((a) => ({
    agendamentoId: a.agendamento_id,
    inicio: a.inicio,
    servicoNome: a.servico_nome,
    profissionalNome: a.profissional_nome,
    jaChegou: a.ja_chegou,
  }));

  return { agendamentos };
}

const confirmarSchema = z.object({
  estabelecimentoId: z.string().uuid(),
  agendamentoId: z.string().uuid(),
  telefone: z.string().min(1),
});

export async function confirmarChegada(
  input: z.infer<typeof confirmarSchema>
): Promise<{ error?: string }> {
  const parsed = confirmarSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("checkin_confirmar_publico", {
    p_agendamento_id: parsed.data.agendamentoId,
    p_estabelecimento_id: parsed.data.estabelecimentoId,
    p_telefone: telefone,
  });

  if (error) return { error: error.message };
  return {};
}

const cartoesSchema = z.object({
  estabelecimentoId: z.string().uuid(),
  telefone: z.string().min(1),
});

export async function buscarCartoesFidelidadeCheckin(
  input: z.infer<typeof cartoesSchema>
): Promise<{ error?: string; cartoes?: FidelidadeStatusPublico[] }> {
  const parsed = cartoesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "WhatsApp inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cartoes_fidelidade_publico_por_telefone", {
    p_estabelecimento_id: parsed.data.estabelecimentoId,
    p_telefone: telefone,
  });

  if (error) return { error: error.message };

  const cartoes: FidelidadeStatusPublico[] = (data ?? []).map((c) => ({
    cartaoId: c.cartao_id,
    programaNome: c.programa_nome,
    brinde: c.brinde,
    selosAtual: c.selos_atual,
    selosNecessarios: c.selos_necessarios,
    status: c.status as FidelidadeStatusPublico["status"],
  }));

  return { cartoes };
}
