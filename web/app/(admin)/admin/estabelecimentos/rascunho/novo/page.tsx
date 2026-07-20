import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { NovaDemoForm } from "./nova-demo-form";

export default async function NovaPaginaDemonstracaoPage() {
  await getSuperAdmin();

  const supabase = await createClient();
  const { data: temasGratis } = await supabase
    .from("temas_plataforma")
    .select("chave, nome, descricao, foto_preview_url")
    .eq("ativo", true)
    .eq("gratis", true)
    .order("nome");

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Heading>Criar página de demonstração</Heading>
      <p className="text-sm text-cinza-600">
        Cria um estabelecimento sem dono para você montar a página pública e mostrar a um cliente em
        potencial. Se ninguém reivindicar em 7 dias, ela é removida automaticamente.
      </p>
      <NovaDemoForm
        temasGratisPremium={(temasGratis ?? []).map((t) => ({
          chave: t.chave,
          nome: t.nome,
          descricao: t.descricao,
          fotoPreviewUrl: t.foto_preview_url,
        }))}
      />
    </div>
  );
}
