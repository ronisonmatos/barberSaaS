import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { ClientesClient } from "./clientes-client";

export default async function ClientesPage() {
  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .eq("barbearia_id", barbearia.id)
    .order("nome");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <ClientesClient
        clientes={clientes ?? []}
        slugBarbearia={barbearia.slug}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
      />
    </div>
  );
}
