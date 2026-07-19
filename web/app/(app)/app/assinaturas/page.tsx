import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { AssinaturasClient, type AssinaturaDetalhada } from "./assinaturas-client";
import { Heading } from "@/components/ui/heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Repeat } from "lucide-react";

export default async function AssinaturasPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: assinaturas } = await supabase
    .from("assinaturas_clientes")
    .select("id, status, ciclo_inicio, ciclo_fim, usos_ciclo, clientes(nome, telefone), planos_estabelecimento(nome, preco_centavos)")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("created_at", { ascending: false });

  const detalhados: AssinaturaDetalhada[] = (assinaturas ?? []).map((a) => ({
    id: a.id,
    status: a.status,
    cicloInicio: a.ciclo_inicio,
    cicloFim: a.ciclo_fim,
    usosCiclo: (a.usos_ciclo as Record<string, number> | null) ?? {},
    clienteNome: a.clientes?.nome ?? "—",
    clienteTelefone: a.clientes?.telefone ?? "—",
    planoNome: a.planos_estabelecimento?.nome ?? "Plano removido",
    planoPrecoCentavos: a.planos_estabelecimento?.preco_centavos ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Heading>Assinaturas</Heading>
      {detalhados.length === 0 ? (
        <EmptyState
          icon={Repeat}
          titulo="Nenhuma assinatura ainda"
          descricao="Assinantes aparecem aqui conforme assinam pela página pública. Configure planos em Configurações → Clube de assinatura."
        />
      ) : (
        <AssinaturasClient assinaturas={detalhados} podeCancelar={papel === "owner"} />
      )}
    </div>
  );
}
