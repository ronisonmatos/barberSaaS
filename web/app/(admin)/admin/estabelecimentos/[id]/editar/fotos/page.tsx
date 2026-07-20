import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { Card } from "@/components/ui/card";
import { GaleriaFormRascunho } from "./galeria-form-rascunho";

export default async function EditarFotosRascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSuperAdminERascunho(id);

  const supabase = await createClient();
  const { data: fotos } = await supabase
    .from("estabelecimento_fotos")
    .select("id, url")
    .eq("estabelecimento_id", id)
    .order("ordem");

  return (
    <Card className="p-4">
      <GaleriaFormRascunho estabelecimentoId={id} fotos={fotos ?? []} />
    </Card>
  );
}
