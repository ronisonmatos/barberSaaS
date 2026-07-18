import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LojaWizard } from "./loja-wizard";
import { PAGINA_WRAP, PAGINA_CARTAO } from "../estilos";

export default async function LojaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ adicionar?: string }>;
}) {
  const { slug } = await params;
  const { adicionar } = await searchParams;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!estabelecimento) notFound();

  const [{ data: produtos }, { data: formasPagamento }] = await Promise.all([
    supabase
      .from("produtos")
      .select("id, nome, preco_centavos, foto_url, estoque")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("ordem"),
    supabase.rpc("formas_pagamento_publico", { p_estabelecimento_id: estabelecimento.id }).maybeSingle(),
  ]);

  return (
    <div className={PAGINA_WRAP}>
      <div className={`${PAGINA_CARTAO} p-6`}>
        <LojaWizard
          estabelecimento={estabelecimento}
          produtos={produtos ?? []}
          produtoInicial={adicionar ?? null}
          formasPagamento={
            formasPagamento ?? {
              aceita_pagamento_antecipado: false,
              aceita_pagamento_no_dia: true,
              gateway_ativo: "nenhum",
              mercado_pago_public_key: null,
            }
          }
        />
      </div>
    </div>
  );
}
