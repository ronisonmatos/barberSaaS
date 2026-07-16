import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { ServicosClient } from "./servicos-client";
import { Heading } from "@/components/ui/heading";

export default async function ServicosPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("nome");

  return (
    <div className="flex flex-col gap-4">
      <Heading>Serviços</Heading>
      <ServicosClient servicos={servicos ?? []} />
    </div>
  );
}
