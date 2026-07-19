import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: expiradas } = await supabase
    .from("assinaturas_clientes")
    .update({ status: "inadimplente" })
    .eq("status", "ativa")
    .lt("ciclo_fim", new Date().toISOString())
    .select("id");

  return NextResponse.json({ marcadas_inadimplente: expiradas?.length ?? 0 });
}
