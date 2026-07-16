import Link from "next/link";
import { notFound } from "next/navigation";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { TicketThread } from "@/components/ticket-thread";
import { responderTicketEstabelecimento, alterarStatusTicketEstabelecimento } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento (nossa equipe está cuidando)",
  resolvido: "Resolvido",
};

export default async function TicketDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets_suporte")
    .select("id, assunto, status, estabelecimento_id")
    .eq("id", id)
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!ticket) notFound();

  const { data: mensagens } = await supabase
    .from("tickets_suporte_mensagens")
    .select("id, mensagem, created_at, usuarios(nome)")
    .eq("ticket_id", id)
    .order("created_at");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/app/suporte" className="text-sm text-cinza-600 underline">
        ← Suporte
      </Link>
      <Heading>{ticket.assunto}</Heading>

      <TicketThread
        mensagens={(mensagens ?? []).map((m) => ({
          id: m.id,
          autorNome: m.usuarios?.nome ?? "—",
          mensagem: m.mensagem,
          criadoEm: m.created_at,
        }))}
        enviarMensagem={responderTicketEstabelecimento.bind(null, id)}
        statusAtual={ticket.status}
        statusLabel={STATUS_LABEL[ticket.status]}
        opcoesStatus={
          ticket.status === "resolvido"
            ? [{ valor: "aberto", label: "Reabrir" }]
            : [{ valor: "resolvido", label: "Marcar como resolvido" }]
        }
        onAlterarStatus={async (novoStatus) => {
          "use server";
          await alterarStatusTicketEstabelecimento(id, novoStatus as "aberto" | "resolvido");
        }}
      />
    </div>
  );
}
