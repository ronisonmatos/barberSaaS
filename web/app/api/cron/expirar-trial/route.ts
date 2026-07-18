import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: planoFree } = await supabase
    .from("planos_plataforma")
    .select("id")
    .eq("nome", "Free")
    .single();
  if (!planoFree) {
    return NextResponse.json({ error: "plano Free não encontrado" }, { status: 500 });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const { data: expirados } = await supabase
    .from("estabelecimentos")
    .select("id")
    .eq("status", "trial")
    .eq("ativacao_manual", false)
    .lt("trial_ate", hoje);

  if (!expirados || expirados.length === 0) {
    return NextResponse.json({ movidos_para_free: 0 });
  }

  const ids = expirados.map((e) => e.id);
  await supabase
    .from("estabelecimentos")
    .update({ plano_plataforma_id: planoFree.id, status: "ativa" })
    .in("id", ids);

  for (const id of ids) {
    await supabase.rpc("aplicar_limites_plano", { p_estabelecimento_id: id });
  }

  return NextResponse.json({ movidos_para_free: ids.length });
}
