import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";
import { CancelarButton } from "./cancelar-button";
import { RemarcarButton } from "./remarcar-button";
import { StatusBadge, type StatusAgendamento } from "@/components/ui/status-badge";
import { PAGINA_WRAP, PAGINA_CARTAO, ROTULO_SECAO } from "../../estilos";

const STATUS_PEDIDO_LABEL: Record<string, string> = {
  pendente: "Aguardando pagamento",
  aguardando_retirada: "Aguardando retirada",
  retirado: "Retirado",
  cancelado: "Cancelado",
};

type ItemPedido = { nome_produto: string; quantidade: number; preco_unitario_centavos: number };

export default async function MeusAgendamentosPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data: agendamentos, error }, { data: pedidos }] = await Promise.all([
    supabase.rpc("agendamento_por_token", { p_token: token }),
    supabase.rpc("pedido_por_token", { p_token: token }),
  ]);

  if ((error || !agendamentos || agendamentos.length === 0) && (!pedidos || pedidos.length === 0)) {
    notFound();
  }

  const nomeEstabelecimento = agendamentos?.[0]?.estabelecimento_nome;

  return (
    <div className={PAGINA_WRAP}>
      <div className={`${PAGINA_CARTAO} flex flex-col gap-4 p-6`}>
        <h1 className="font-display text-2xl text-tenant-fg">
          Meus agendamentos e pedidos{nomeEstabelecimento ? ` — ${nomeEstabelecimento}` : ""}
        </h1>
        {agendamentos && agendamentos.length > 0 && (
          <div className="flex flex-col gap-3">
            {(pedidos?.length ?? 0) > 0 && <p className={ROTULO_SECAO}>Agendamentos</p>}
            {agendamentos.map((ag) => {
              const podeCancel = ag.status === "pendente" || ag.status === "confirmado";
              return (
                <div
                  key={ag.agendamento_id}
                  className="flex flex-col gap-1 rounded-xl border border-tenant-linha bg-tenant-bg p-4"
                >
                  <p className="font-medium text-tenant-fg">
                    {new Date(ag.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <p className="text-tenant-fg opacity-80">
                    {ag.servico_nome} com {ag.profissional_nome}
                  </p>
                  <p className="text-sm tabular-nums text-tenant-fg opacity-70">{centavosToBRL(ag.preco_centavos)}</p>
                  <StatusBadge status={ag.status as StatusAgendamento} />
                  {podeCancel && (
                    <div className="flex flex-col gap-2">
                      <RemarcarButton
                        token={token}
                        agendamentoId={ag.agendamento_id}
                        estabelecimentoId={ag.estabelecimento_id}
                        profissionalId={ag.profissional_id}
                        servicoId={ag.servico_id}
                      />
                      <CancelarButton token={token} agendamentoId={ag.agendamento_id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pedidos && pedidos.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className={ROTULO_SECAO}>Meus pedidos</p>
            {pedidos.map((pd) => (
              <div
                key={pd.pedido_id}
                className="flex flex-col gap-1 rounded-xl border border-tenant-linha bg-tenant-bg p-4"
              >
                <p className="font-medium text-tenant-fg">
                  {new Date(pd.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <ul className="text-sm text-tenant-fg opacity-80">
                  {((pd.itens as ItemPedido[] | null) ?? []).map((item, i) => (
                    <li key={i}>
                      {item.quantidade}x {item.nome_produto}
                    </li>
                  ))}
                </ul>
                <p className="text-sm tabular-nums text-tenant-fg opacity-70">{centavosToBRL(pd.total_centavos)}</p>
                <p className="text-sm font-medium text-tenant-fg">
                  {STATUS_PEDIDO_LABEL[pd.status] ?? pd.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
