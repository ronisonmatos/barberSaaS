import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { FidelidadeClient, type CartaoDetalhado } from "./fidelidade-client";
import { Heading } from "@/components/ui/heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Award } from "lucide-react";

export default async function FidelidadePage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [{ data: cartoes }, { data: servicos }, { data: produtos }] = await Promise.all([
    supabase
      .from("cartoes_fidelidade")
      .select(
        "id, selos_atual, status, completado_em, resgatado_em, clientes(nome, telefone), programas_fidelidade(nome, selos_necessarios, brinde_tipo, brinde_servico_id, brinde_produto_id)"
      )
      .eq("estabelecimento_id", estabelecimento.id)
      .order("completado_em", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("servicos").select("id, nome").eq("estabelecimento_id", estabelecimento.id),
    supabase.from("produtos").select("id, nome").eq("estabelecimento_id", estabelecimento.id),
  ]);

  const nomeServico = (id: string | null) => servicos?.find((s) => s.id === id)?.nome ?? "Serviço removido";
  const nomeProduto = (id: string | null) => produtos?.find((p) => p.id === id)?.nome ?? "Produto removido";

  const detalhados: CartaoDetalhado[] = (cartoes ?? [])
    .filter((c) => c.programas_fidelidade)
    .map((c) => ({
      id: c.id,
      selosAtual: c.selos_atual,
      status: c.status as CartaoDetalhado["status"],
      completadoEm: c.completado_em,
      resgatadoEm: c.resgatado_em,
      clienteNome: c.clientes?.nome ?? "—",
      clienteTelefone: c.clientes?.telefone ?? "—",
      programaNome: c.programas_fidelidade!.nome,
      selosNecessarios: c.programas_fidelidade!.selos_necessarios,
      brinde:
        c.programas_fidelidade!.brinde_tipo === "servico"
          ? nomeServico(c.programas_fidelidade!.brinde_servico_id)
          : nomeProduto(c.programas_fidelidade!.brinde_produto_id),
    }));

  return (
    <div className="flex flex-col gap-4">
      <Heading>Fidelidade</Heading>
      {detalhados.length === 0 ? (
        <EmptyState
          icon={Award}
          titulo="Nenhum cartão de fidelidade ainda"
          descricao="Cartões aparecem aqui conforme os clientes completam serviços marcados como concluídos. Configure um programa em Configurações → Cartão fidelidade."
        />
      ) : (
        <FidelidadeClient cartoes={detalhados} />
      )}
    </div>
  );
}
