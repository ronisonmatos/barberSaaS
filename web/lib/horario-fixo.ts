import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Regra = { servico_id: string; quantidade_mes: number };

export const schemaHorarioFixo = z
  .object({
    servicoId: z.string().uuid(),
    profissionalId: z.string().uuid(),
    tipoRecorrencia: z.enum(["intervalo", "mensal"]),
    intervaloDias: z.coerce.number().int().min(1).max(90).optional(),
    diaSemana: z.coerce.number().int().min(0).max(6).optional(),
    ordinalSemana: z.coerce.number().int().refine((v) => [1, 2, 3, 4, -1].includes(v)).optional(),
    horario: z.string().regex(/^\d{2}:\d{2}$/, { error: "Horário inválido." }),
    proximaData: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Data inválida." }),
    reservarAutomaticamente: z.boolean(),
  })
  .refine(
    (v) =>
      v.tipoRecorrencia === "intervalo"
        ? v.intervaloDias !== undefined
        : v.diaSemana !== undefined && v.ordinalSemana !== undefined,
    { error: "Preencha os campos da recorrência escolhida." }
  );

export type HorarioFixoInput = z.infer<typeof schemaHorarioFixo>;

export function parseHorarioFixoFormData(formData: FormData) {
  const tipoRecorrencia = formData.get("tipoRecorrencia");
  return schemaHorarioFixo.safeParse({
    servicoId: formData.get("servicoId"),
    profissionalId: formData.get("profissionalId"),
    tipoRecorrencia,
    intervaloDias: tipoRecorrencia === "intervalo" ? formData.get("intervaloDias") : undefined,
    diaSemana: tipoRecorrencia === "mensal" ? formData.get("diaSemana") : undefined,
    ordinalSemana: tipoRecorrencia === "mensal" ? formData.get("ordinalSemana") : undefined,
    horario: formData.get("horario"),
    proximaData: formData.get("proximaData"),
    reservarAutomaticamente: formData.get("reservarAutomaticamente") === "on",
  });
}

export async function getMeuProfissionalId(
  supabase: SupabaseClient<Database>,
  estabelecimentoId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profissionais")
    .select("id")
    .eq("estabelecimento_id", estabelecimentoId)
    .eq("usuario_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Checagens (agenda restrita pra staff, serviço coberto pelo plano, profissional realiza o
 * serviço, e não ultrapassa quantas vezes por mês o plano cobre aquele serviço), sem gravar nada.
 *
 * Um plano pode cobrir o mesmo serviço mais de uma vez por mês (ex: "2x Corte Clássico/mês") --
 * cada vez conta como um horário fixo separado (dias/horários diferentes), então valida contando
 * quantos horários fixos ATIVOS já existem pra esse (assinatura, serviço) e comparando com
 * quantidade_mes. `assinaturaClienteId` vem null no cadastro combinado de cliente VIP (a
 * assinatura ainda não existe nesse momento) -- nesse caso a contagem é sempre 0, então a
 * checagem passa trivialmente (é sempre o 1º horário fixo daquela assinatura).
 */
export async function validarHorarioFixo(
  supabase: SupabaseClient<Database>,
  params: {
    estabelecimentoId: string;
    papel: "owner" | "staff";
    userId: string;
    assinaturaClienteId: string | null;
    horarioFixoIdAtual: string | null;
    regrasDoPlano: Regra[];
    dados: HorarioFixoInput;
  }
): Promise<{ error?: string }> {
  const { estabelecimentoId, papel, userId, assinaturaClienteId, horarioFixoIdAtual, regrasDoPlano, dados } = params;

  if (papel !== "owner") {
    const meuProfissionalId = await getMeuProfissionalId(supabase, estabelecimentoId, userId);
    if (!meuProfissionalId || meuProfissionalId !== dados.profissionalId) {
      return { error: "Você só pode configurar horário fixo na sua própria agenda." };
    }
  }

  const regra = regrasDoPlano.find((r) => r.servico_id === dados.servicoId);
  if (!regra) {
    return { error: "Esse serviço não está incluído no plano." };
  }

  const { data: vinculo } = await supabase
    .from("profissional_servicos")
    .select("profissional_id")
    .eq("profissional_id", dados.profissionalId)
    .eq("servico_id", dados.servicoId)
    .maybeSingle();
  if (!vinculo) return { error: "Esse profissional não realiza o serviço escolhido." };

  if (assinaturaClienteId) {
    let query = supabase
      .from("assinatura_horarios_fixos")
      .select("id", { count: "exact", head: true })
      .eq("assinatura_cliente_id", assinaturaClienteId)
      .eq("servico_id", dados.servicoId)
      .eq("ativo", true);
    if (horarioFixoIdAtual) query = query.neq("id", horarioFixoIdAtual);
    const { count } = await query;
    if ((count ?? 0) >= regra.quantidade_mes) {
      return {
        error:
          regra.quantidade_mes === 1
            ? "Esse plano só cobre esse serviço 1x por mês, e já existe um horário fixo configurado pra ele."
            : `Esse plano cobre esse serviço até ${regra.quantidade_mes}x por mês, e já há ${count} horário(s) fixo(s) configurado(s) pra ele.`,
      };
    }
  }

  return {};
}

/** Cria um novo horário fixo, ou atualiza um existente se `horarioFixoId` for informado. */
export async function upsertHorarioFixo(
  supabase: SupabaseClient<Database>,
  params: {
    estabelecimentoId: string;
    assinaturaClienteId: string;
    horarioFixoId: string | null;
    dados: HorarioFixoInput;
  }
): Promise<{ error?: string }> {
  const { estabelecimentoId, assinaturaClienteId, horarioFixoId, dados } = params;

  const payload = {
    estabelecimento_id: estabelecimentoId,
    assinatura_cliente_id: assinaturaClienteId,
    servico_id: dados.servicoId,
    profissional_id: dados.profissionalId,
    tipo_recorrencia: dados.tipoRecorrencia,
    intervalo_dias: dados.tipoRecorrencia === "intervalo" ? (dados.intervaloDias ?? null) : null,
    dia_semana: dados.tipoRecorrencia === "mensal" ? (dados.diaSemana ?? null) : null,
    ordinal_semana: dados.tipoRecorrencia === "mensal" ? (dados.ordinalSemana ?? null) : null,
    horario: dados.horario,
    proxima_data: dados.proximaData,
    reservar_automaticamente: dados.reservarAutomaticamente,
    ativo: true,
  };

  if (horarioFixoId) {
    const { error } = await supabase
      .from("assinatura_horarios_fixos")
      .update(payload)
      .eq("id", horarioFixoId)
      .eq("estabelecimento_id", estabelecimentoId);
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await supabase.from("assinatura_horarios_fixos").insert(payload);
  if (error) return { error: error.message };
  return {};
}

export async function validarEUpsertarHorarioFixo(
  supabase: SupabaseClient<Database>,
  params: {
    estabelecimentoId: string;
    papel: "owner" | "staff";
    userId: string;
    assinaturaClienteId: string;
    horarioFixoIdAtual: string | null;
    regrasDoPlano: Regra[];
    dados: HorarioFixoInput;
  }
): Promise<{ error?: string }> {
  const validacao = await validarHorarioFixo(supabase, params);
  if (validacao.error) return validacao;
  return upsertHorarioFixo(supabase, {
    estabelecimentoId: params.estabelecimentoId,
    assinaturaClienteId: params.assinaturaClienteId,
    horarioFixoId: params.horarioFixoIdAtual,
    dados: params.dados,
  });
}
