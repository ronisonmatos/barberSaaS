import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VoltarConfiguracoes } from "../voltar-link";
import { TemplateForm } from "./template-form";

export default async function TemplateConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Template</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: temas }, { data: compras }, { data: userData }, { data: profissionais }] = await Promise.all([
    supabase.from("temas_plataforma").select("*").eq("ativo", true).order("preco_centavos"),
    supabase
      .from("estabelecimento_temas_comprados")
      .select("tema_plataforma_id")
      .eq("estabelecimento_id", estabelecimento.id),
    supabase.auth.getUser(),
    supabase
      .from("profissionais")
      .select("id, nome, foto_url")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
  ]);

  const config = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const layoutAtual = typeof config.layout === "string" ? config.layout : "classico";
  const temasComprados = new Set((compras ?? []).map((c) => c.tema_plataforma_id));
  const publicKey = process.env.MERCADO_PAGO_PLATFORM_PUBLIC_KEY ?? null;

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Template</Heading>
      <Card className="p-4">
        <p className="mb-4 text-sm text-cinza-600">
          Escolha o layout da sua página pública (<code>/b/{estabelecimento.slug}</code>) — como a home
          se organiza: hero, serviços, produtos, profissionais.
        </p>
        <TemplateForm
          layoutAtual={layoutAtual}
          temasPremium={(temas ?? []).map((t) => ({
            id: t.id,
            chave: t.chave,
            nome: t.nome,
            descricao: t.descricao,
            precoCentavos: t.preco_centavos,
            gratis: t.gratis,
            fotoPreviewUrl: t.foto_preview_url,
            comprado: t.gratis || temasComprados.has(t.id),
          }))}
          profissionais={(profissionais ?? []).map((p) => ({ id: p.id, nome: p.nome, fotoUrl: p.foto_url }))}
          publicKey={publicKey}
          email={userData.user?.email ?? ""}
        />
      </Card>
    </div>
  );
}
