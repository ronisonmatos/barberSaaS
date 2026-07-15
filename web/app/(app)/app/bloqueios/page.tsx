import { createClient } from "@/lib/supabase/server";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { BloqueiosClient } from "./bloqueios-client";

export default async function BloqueiosPage() {
  const { barbearia } = await getBarbeariaAtiva();
  const supabase = await createClient();

  const [{ data: bloqueios }, { data: profissionais }] = await Promise.all([
    supabase
      .from("bloqueios")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .order("inicio", { ascending: false }),
    supabase.from("profissionais").select("*").eq("barbearia_id", barbearia.id).order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Bloqueios</h1>
      <BloqueiosClient bloqueios={bloqueios ?? []} profissionais={profissionais ?? []} />
    </div>
  );
}
