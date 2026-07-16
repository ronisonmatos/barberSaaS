import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { PlanosClient } from "./planos-client";

export default async function AdminPlanosPage() {
  await getSuperAdmin();
  const supabase = await createClient();
  const { data: planos } = await supabase.from("planos_plataforma").select("*").order("preco_centavos");

  return (
    <div className="flex flex-col gap-4">
      <Heading>Planos da plataforma</Heading>
      <PlanosClient planos={planos ?? []} />
    </div>
  );
}
