import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { RelatoriosNav } from "./relatorios-nav";

export default async function RelatoriosLayout({ children }: { children: React.ReactNode }) {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: permite } = await supabase.rpc("estabelecimento_permite_relatorios", {
    p_estabelecimento_id: estabelecimento.id,
  });

  if (!permite) {
    return (
      <div className="flex flex-col gap-4">
        <Heading>Relatórios</Heading>
        <Card className="p-4 text-sm text-cinza-600">
          Relatórios estão disponíveis no plano Pro.{" "}
          <Link href="/app/configuracoes/plano" className="font-medium text-latao-escuro underline">
            Faça upgrade de plano
          </Link>{" "}
          para ver o financeiro, os agendamentos e as vendas de produtos em detalhe.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading>Relatórios</Heading>
      <RelatoriosNav papel={papel} />
      {children}
    </div>
  );
}
