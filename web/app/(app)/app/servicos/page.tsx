import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { ServicosClient } from "./servicos-client";

export default async function ServicosPage() {
  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("barbearia_id", barbearia.id)
    .order("nome");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Serviços</h1>
      <ServicosClient servicos={servicos ?? []} />
    </div>
  );
}
