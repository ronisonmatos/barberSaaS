import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { PlanosClubeRascunhoClient } from "./planos-rascunho-client";

export default async function EditarAssinaturasRascunhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSuperAdminERascunho(id);

  const supabase = await createClient();
  const [{ data: planosClube }, { data: servicos }] = await Promise.all([
    supabase.from("planos_estabelecimento").select("*").eq("estabelecimento_id", id).order("created_at"),
    supabase.from("servicos").select("id, nome").eq("estabelecimento_id", id).eq("ativo", true).order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cinza-600">
        Cliente assina um plano na página pública e paga o 1º ciclo (Pix ou cartão). Enquanto a
        assinatura estiver ativa e dentro da quota do ciclo, os agendamentos dos serviços cobertos
        saem sem cobrança automaticamente.
      </p>
      <PlanosClubeRascunhoClient estabelecimentoId={id} planos={planosClube ?? []} servicos={servicos ?? []} />
    </div>
  );
}
