import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { EquipeForm } from "../equipe-form";
import { VoltarConfiguracoes } from "../voltar-link";

const LIMITE_USUARIOS_SEM_PLANO = 1;

export default async function EquipeConfigPage() {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Equipe</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: membrosData }, { data: plano }] = await Promise.all([
    supabase
      .from("membros_estabelecimento")
      .select("id, papel, usuario_id, ativo, desativado_por_limite_plano, usuarios(nome, genero)")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("papel"),
    estabelecimento.plano_plataforma_id
      ? supabase
          .from("planos_plataforma")
          .select("max_usuarios")
          .eq("id", estabelecimento.plano_plataforma_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const membros = (membrosData ?? []).map((m) => ({
    id: m.id,
    nome: m.usuarios?.nome ?? "—",
    genero: m.usuarios?.genero ?? null,
    papel: m.papel,
    usuarioId: m.usuario_id,
    ativo: m.ativo,
    desativadoPorLimitePlano: m.desativado_por_limite_plano,
  }));
  const limiteUsuarios = estabelecimento.plano_plataforma_id
    ? (plano?.max_usuarios ?? null)
    : LIMITE_USUARIOS_SEM_PLANO;

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Equipe</Heading>
      <Card className="p-4">
        <EquipeForm membros={membros} limite={limiteUsuarios} meuUsuarioId={userId} />
      </Card>
    </div>
  );
}
