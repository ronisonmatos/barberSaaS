import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { ServicosRascunhoClient } from "./servicos-rascunho-client";

export default async function EditarServicosRascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSuperAdminERascunho(id);

  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("estabelecimento_id", id)
    .order("nome");

  return <ServicosRascunhoClient estabelecimentoId={id} servicos={servicos ?? []} />;
}
