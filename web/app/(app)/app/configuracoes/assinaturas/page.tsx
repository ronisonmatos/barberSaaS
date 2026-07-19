import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { PlanosClubeClient } from "./planos-client";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VoltarConfiguracoes } from "../voltar-link";

export default async function AssinaturasConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Clube de assinatura</Heading>
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

  const permiteClube = estabelecimento.plano_plataforma_id
    ? Boolean((plano?.recursos as Record<string, boolean> | null)?.clube_assinatura)
    : true;

  if (!permiteClube) {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Clube de assinatura</Heading>
        <Card className="p-4 text-sm text-cinza-600">
          O clube de assinatura não está disponível no plano Free.{" "}
          <Link href="/app/configuracoes/plano" className="font-medium text-latao-escuro underline">
            Faça upgrade de plano
          </Link>{" "}
          para vender planos recorrentes aos seus clientes.
        </Card>
      </div>
    );
  }

  const [{ data: planosClube }, { data: servicos }] = await Promise.all([
    supabase
      .from("planos_estabelecimento")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("created_at"),
    supabase
      .from("servicos")
      .select("id, nome")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Clube de assinatura</Heading>
      <p className="text-sm text-cinza-600">
        Cliente assina um plano na página pública e paga o 1º ciclo (Pix ou cartão). Enquanto a
        assinatura estiver ativa e dentro da quota do ciclo, os agendamentos dos serviços cobertos
        saem sem cobrança automaticamente.
      </p>
      <PlanosClubeClient planos={planosClube ?? []} servicos={servicos ?? []} />
    </div>
  );
}
