import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";
import { CancelarButton } from "./cancelar-button";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "Não compareceu",
};

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
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Meus agendamentos — {agendamentos[0].barbearia_nome}</h1>
      {agendamentos.map((ag) => {
        const podeCancel = ag.status === "pendente" || ag.status === "confirmado";
        return (
          <div key={ag.agendamento_id} className="flex flex-col gap-1 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="font-medium">
              {new Date(ag.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <p>{ag.servico_nome} com {ag.profissional_nome}</p>
            <p className="text-sm text-neutral-500">{centavosToBRL(ag.preco_centavos)}</p>
            <p className="text-sm text-neutral-500">{STATUS_LABEL[ag.status]}</p>
            {podeCancel && <CancelarButton token={token} agendamentoId={ag.agendamento_id} />}
          </div>
        );
      })}
    </div>
  );
}
