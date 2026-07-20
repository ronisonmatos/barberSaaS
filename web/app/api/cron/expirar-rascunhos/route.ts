import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: vencidos } = await supabase
    .from("estabelecimentos")
    .select("id")
    .eq("rascunho", true)
    .lt("rascunho_expira_em", new Date().toISOString());

  if (!vencidos || vencidos.length === 0) {
    return NextResponse.json({ rascunhos_removidos: 0 });
  }

  for (const { id } of vencidos) {
    const [{ data: raiz }, { data: galeria }] = await Promise.all([
      supabase.storage.from("logos").list(id),
      supabase.storage.from("logos").list(`${id}/galeria`),
    ]);
    const caminhos = [
      ...(raiz ?? []).filter((f) => f.id).map((f) => `${id}/${f.name}`),
      ...(galeria ?? []).map((f) => `${id}/galeria/${f.name}`),
    ];
    if (caminhos.length > 0) {
      await supabase.storage.from("logos").remove(caminhos);
    }
    await supabase.from("estabelecimentos").delete().eq("id", id);
  }

  return NextResponse.json({ rascunhos_removidos: vencidos.length });
}
