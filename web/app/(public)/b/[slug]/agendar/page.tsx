import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendarWizard } from "./agendar-wizard";
import { PAGINA_WRAP, PAGINA_CARTAO } from "../estilos";

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!estabelecimento) notFound();

  const [{ data: servicos }, { data: profissionais }, { data: vinculos }, { data: formasPagamento }] =
    await Promise.all([
      supabase
        .from("servicos")
        .select("*")
        .eq("estabelecimento_id", estabelecimento.id)
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("profissionais")
        .select("*")
        .eq("estabelecimento_id", estabelecimento.id)
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("profissional_servicos")
        .select("profissional_id, servico_id, profissionais!inner(estabelecimento_id)")
        .eq("profissionais.estabelecimento_id", estabelecimento.id),
      supabase.rpc("formas_pagamento_publico", { p_estabelecimento_id: estabelecimento.id }).maybeSingle(),
    ]);

  return (
    <div className={PAGINA_WRAP}>
      <div className={`${PAGINA_CARTAO} p-6`}>
        <AgendarWizard
          estabelecimento={estabelecimento}
          servicos={servicos ?? []}
          profissionais={profissionais ?? []}
          vinculos={vinculos ?? []}
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
