import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { BloqueiosClient } from "./bloqueios-client";
import { Heading } from "@/components/ui/heading";

export default async function BloqueiosPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [{ data: bloqueios }, { data: profissionais }] = await Promise.all([
    supabase
      .from("bloqueios")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("inicio", { ascending: false }),
    supabase.from("profissionais").select("*").eq("estabelecimento_id", estabelecimento.id).order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Heading>Bloqueios</Heading>
      <BloqueiosClient bloqueios={bloqueios ?? []} profissionais={profissionais ?? []} />
    </div>
  );
}
