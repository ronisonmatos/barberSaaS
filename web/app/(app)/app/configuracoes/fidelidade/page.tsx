import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { ProgramasFidelidadeClient } from "./programas-client";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VoltarConfiguracoes } from "../voltar-link";

export default async function FidelidadeConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Cartão fidelidade</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: plano } = estabelecimento.plano_plataforma_id
    ? await supabase
        .from("planos_plataforma")
        .select("recursos")
        .eq("id", estabelecimento.plano_plataforma_id)
        .single()
    : { data: null };

  const permiteFidelidade = estabelecimento.plano_plataforma_id
    ? Boolean((plano?.recursos as Record<string, boolean> | null)?.fidelidade)
    : true;

  if (!permiteFidelidade) {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Cartão fidelidade</Heading>
        <Card className="p-4 text-sm text-cinza-600">
          O cartão fidelidade não está disponível no plano Free.{" "}
          <Link href="/app/configuracoes/plano" className="font-medium text-latao-escuro underline">
            Faça upgrade de plano
          </Link>{" "}
          para configurar programas de fidelidade.
        </Card>
      </div>
    );
  }

  const [{ data: programas }, { data: servicos }, { data: produtos }] = await Promise.all([
    supabase
      .from("programas_fidelidade")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("created_at"),
    supabase
      .from("servicos")
      .select("id, nome")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("produtos")
      .select("id, nome")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Cartão fidelidade</Heading>
      <p className="text-sm text-cinza-600">
        Cada programa conta selos para um serviço específico. O selo só é concedido quando o
        agendamento é marcado concluído na Agenda — nunca no ato de agendar ou pagar.
      </p>
      <ProgramasFidelidadeClient
        programas={programas ?? []}
        servicos={servicos ?? []}
        produtos={produtos ?? []}
      />
    </div>
  );
}
