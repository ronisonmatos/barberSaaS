import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { ClientesClient } from "./clientes-client";
import { Heading } from "@/components/ui/heading";

export default async function ClientesPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("nome");

  return (
    <div className="flex flex-col gap-4">
      <Heading>Clientes</Heading>
      <ClientesClient
        clientes={clientes ?? []}
        slugEstabelecimento={estabelecimento.slug}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
      />
    </div>
  );
}
