import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";
import { CancelarButton } from "./cancelar-button";
import { StatusBadge, type StatusAgendamento } from "@/components/ui/status-badge";

export default async function MeusAgendamentosPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: agendamentos, error } = await supabase.rpc("agendamento_por_token", {
    p_token: token,
  });

  if (error || !agendamentos || agendamentos.length === 0) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-10">
      <h1 className="font-display text-2xl text-tenant-fg">
        Meus agendamentos — {agendamentos[0].estabelecimento_nome}
      </h1>
      {agendamentos.map((ag) => {
        const podeCancel = ag.status === "pendente" || ag.status === "confirmado";
        return (
          <div
            key={ag.agendamento_id}
            className="flex flex-col gap-1 rounded-md border border-tenant-linha bg-tenant-bg-2 p-4"
          >
            <p className="font-medium text-tenant-fg">
              {new Date(ag.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <p className="text-tenant-fg opacity-80">
              {ag.servico_nome} com {ag.profissional_nome}
            </p>
            <p className="text-sm tabular-nums text-tenant-fg opacity-70">{centavosToBRL(ag.preco_centavos)}</p>
            <StatusBadge status={ag.status as StatusAgendamento} />
            {podeCancel && <CancelarButton token={token} agendamentoId={ag.agendamento_id} />}
          </div>
        );
      })}
    </div>
  );
}
