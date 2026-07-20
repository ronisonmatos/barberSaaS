import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { ProdutosRascunhoClient } from "./produtos-rascunho-client";

export default async function EditarProdutosRascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSuperAdminERascunho(id);

  const supabase = await createClient();
  const { data: produtos } = await supabase
    .from("produtos")
    .select("*")
    .eq("estabelecimento_id", id)
    .order("ordem");

  return <ProdutosRascunhoClient estabelecimentoId={id} produtos={produtos ?? []} />;
}
