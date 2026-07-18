import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { GaleriaForm } from "../galeria-form";
import { VoltarConfiguracoes } from "../voltar-link";

const LIMITE_FOTOS_SEM_PLANO = 5;

export default async function FotosConfigPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [{ data: fotos }, { data: planoFotos }] = await Promise.all([
    supabase
      .from("estabelecimento_fotos")
      .select("id, url, ativo, desativado_por_limite_plano")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("ordem"),
    estabelecimento.plano_plataforma_id
      ? supabase
          .from("planos_plataforma")
          .select("max_fotos")
          .eq("id", estabelecimento.plano_plataforma_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const limiteFotos = estabelecimento.plano_plataforma_id
    ? (planoFotos?.max_fotos ?? null)
    : LIMITE_FOTOS_SEM_PLANO;
  const fotosForm = (fotos ?? []).map((f) => ({
    id: f.id,
    url: f.url,
    ativo: f.ativo,
    desativadoPorLimitePlano: f.desativado_por_limite_plano,
  }));

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Fotos do estabelecimento</Heading>
      <Card className="p-4">
        <GaleriaForm fotos={fotosForm} limite={limiteFotos} />
      </Card>
    </div>
  );
}
