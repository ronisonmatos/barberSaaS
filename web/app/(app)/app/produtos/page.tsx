import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { ProdutosClient } from "./produtos-client";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";

export default async function ProdutosPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: plano } = estabelecimento.plano_plataforma_id
    ? await supabase
        .from("planos_plataforma")
        .select("recursos, max_produtos")
        .eq("id", estabelecimento.plano_plataforma_id)
        .single()
    : { data: null };

  const permiteLoja = estabelecimento.plano_plataforma_id
    ? Boolean((plano?.recursos as Record<string, boolean> | null)?.loja)
    : true;

  if (!permiteLoja) {
    return (
      <div className="flex flex-col gap-4">
        <Heading>Produtos</Heading>
        <Card className="p-4 text-sm text-cinza-600">
          A loja de produtos não está disponível no plano Free.{" "}
          <Link href="/app/configuracoes/plano" className="font-medium text-latao-escuro underline">
            Faça upgrade de plano
          </Link>{" "}
          para cadastrar produtos e vendê-los na página pública.
        </Card>
      </div>
    );
  }

  const { data: produtos } = await supabase
    .from("produtos")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("ordem");

  return (
    <div className="flex flex-col gap-4">
      <Heading>Produtos</Heading>
      <ProdutosClient
        produtos={produtos ?? []}
        limite={estabelecimento.plano_plataforma_id ? (plano?.max_produtos ?? null) : null}
        estabelecimentoSlug={estabelecimento.slug}
      />
    </div>
  );
}
