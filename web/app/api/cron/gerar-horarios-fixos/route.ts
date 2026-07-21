import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const DIAS_ANTECEDENCIA = 7;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const limite = new Date(Date.now() + DIAS_ANTECEDENCIA * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: elegiveis } = await supabase
    .from("assinatura_horarios_fixos")
    .select("id")
    .eq("ativo", true)
    .eq("reservar_automaticamente", true)
    .lte("proxima_data", limite);

  let processados = 0;
  for (const regra of elegiveis ?? []) {
    const { error } = await supabase.rpc("gerar_ocorrencia_horario_fixo", { p_horario_fixo_id: regra.id });
    if (!error) processados++;
  }

  return NextResponse.json({ elegiveis: elegiveis?.length ?? 0, processados });
}
