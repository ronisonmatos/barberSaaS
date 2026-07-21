"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { parseHorarioFixoFormData, validarEUpsertarHorarioFixo, getMeuProfissionalId, type Regra } from "@/lib/horario-fixo";

export async function salvarHorarioFixo(formData: FormData): Promise<{ error?: string }> {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();

  const parsed = parseHorarioFixoFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const assinaturaClienteId = formData.get("assinaturaClienteId");
  if (typeof assinaturaClienteId !== "string") return { error: "Assinatura não informada." };
  const horarioFixoIdAtual = (formData.get("horarioFixoId") as string) || null;

  const supabase = await createClient();

  const { data: assinatura } = await supabase
    .from("assinaturas_clientes")
    .select("id, planos_estabelecimento(regras)")
    .eq("id", assinaturaClienteId)
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();
  if (!assinatura) return { error: "Assinatura não encontrada." };

  const regrasDoPlano = (assinatura.planos_estabelecimento?.regras as Regra[] | null) ?? [];

  const resultado = await validarEUpsertarHorarioFixo(supabase, {
    estabelecimentoId: estabelecimento.id,
    papel,
    userId,
    assinaturaClienteId,
    horarioFixoIdAtual,
    regrasDoPlano,
    dados: parsed.data,
  });
  if (resultado.error) return resultado;

  revalidatePath("/app/assinaturas");
  return {};
}

export async function desativarHorarioFixo(id: string): Promise<{ error?: string }> {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  if (papel !== "owner") {
    const [meuProfissionalId, { data: regra }] = await Promise.all([
      getMeuProfissionalId(supabase, estabelecimento.id, userId),
      supabase
        .from("assinatura_horarios_fixos")
        .select("profissional_id")
        .eq("id", id)
        .eq("estabelecimento_id", estabelecimento.id)
        .maybeSingle(),
    ]);
    if (!regra || !meuProfissionalId || regra.profissional_id !== meuProfissionalId) {
      return { error: "Você só pode remover horário fixo da sua própria agenda." };
    }
  }

  const { error } = await supabase
    .from("assinatura_horarios_fixos")
    .update({ ativo: false })
    .eq("id", id)
    .eq("estabelecimento_id", estabelecimento.id);
  if (error) return { error: error.message };

  revalidatePath("/app/assinaturas");
  return {};
}
