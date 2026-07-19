import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { TemasClient } from "./temas-client";

export default async function AdminTemasPage() {
  await getSuperAdmin();
  const supabase = await createClient();
  const { data: temas } = await supabase.from("temas_plataforma").select("*").order("preco_centavos");

  return (
    <div className="flex flex-col gap-4">
      <Heading>Temas de página pública</Heading>
      <TemasClient temas={temas ?? []} />
    </div>
  );
}
