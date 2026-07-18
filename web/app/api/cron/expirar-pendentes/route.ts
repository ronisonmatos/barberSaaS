import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { devolverEstoquePedido } from "@/lib/estoque";

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

  const idsAgendamentos = (expirados ?? []).map((a) => a.id);
  if (idsAgendamentos.length > 0) {
    await supabase.from("agendamentos").update({ status: "cancelado" }).in("id", idsAgendamentos);
    await supabase
      .from("pagamentos")
      .update({ status: "cancelado" })
      .in("agendamento_id", idsAgendamentos)
      .eq("status", "pendente");
  }

  // Pedidos "pendente" expiram pelo proprio prazo, ou junto com o agendamento combinado que
  // acabou de expirar acima (mesmo se o pedido em si ainda estiver dentro dos 15min).
  let query = supabase.from("pedidos").select("id").eq("status", "pendente");
  query =
    idsAgendamentos.length > 0
      ? query.or(`created_at.lt.${corte},agendamento_id.in.(${idsAgendamentos.join(",")})`)
      : query.lt("created_at", corte);
  const { data: pedidosExpirados } = await query;

  const idsPedidos = (pedidosExpirados ?? []).map((p) => p.id);
  for (const pedidoId of idsPedidos) {
    await devolverEstoquePedido(supabase, pedidoId);
  }
  if (idsPedidos.length > 0) {
    await supabase.from("pedidos").update({ status: "cancelado" }).in("id", idsPedidos);
    await supabase
      .from("pagamentos")
      .update({ status: "cancelado" })
      .in("pedido_id", idsPedidos)
      .eq("status", "pendente");
  }

  return NextResponse.json({ cancelados: idsAgendamentos.length, pedidos_cancelados: idsPedidos.length });
}
