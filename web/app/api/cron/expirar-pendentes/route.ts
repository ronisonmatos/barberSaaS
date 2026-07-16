import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const corte = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: expirados } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("status", "pendente")
    .lt("created_at", corte);

  if (!expirados || expirados.length === 0) {
    return NextResponse.json({ cancelados: 0 });
  }

  const ids = expirados.map((a) => a.id);
  await supabase.from("agendamentos").update({ status: "cancelado" }).in("id", ids);
  await supabase.from("pagamentos").update({ status: "cancelado" }).in("agendamento_id", ids).eq("status", "pendente");

  return NextResponse.json({ cancelados: ids.length });
}
