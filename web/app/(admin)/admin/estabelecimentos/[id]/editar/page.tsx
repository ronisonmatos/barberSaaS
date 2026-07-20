import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { Card } from "@/components/ui/card";
import { IdentidadeForm } from "./identidade-form";

export default async function EditarIdentidadeRascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { estabelecimento } = await getSuperAdminERascunho(id);

  const supabase = await createClient();
  const { data: temasGratis } = await supabase
    .from("temas_plataforma")
    .select("id, chave, nome, descricao, foto_preview_url")
    .eq("ativo", true)
    .eq("gratis", true)
    .order("nome");

  const config = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const tema = typeof config.tema === "string" ? config.tema : "classica";
  const layout = typeof config.layout === "string" ? config.layout : "classico";

  return (
    <Card className="p-4">
      <IdentidadeForm
        estabelecimentoId={id}
        nomeAtual={estabelecimento.nome}
        slugAtual={estabelecimento.slug}
        temaAtual={tema}
        layoutAtual={layout}
        temasGratisPremium={(temasGratis ?? []).map((t) => ({
          chave: t.chave,
          nome: t.nome,
          descricao: t.descricao,
          fotoPreviewUrl: t.foto_preview_url,
        }))}
        logoUrl={estabelecimento.logo_url}
      />
    </Card>
  );
}
