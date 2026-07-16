import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { TicketThread } from "@/components/ticket-thread";
import { responderTicketAdmin, alterarStatusTicketAdmin } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

export default async function AdminTicketDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await getSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets_suporte")
    .select("id, assunto, status, estabelecimento_id, estabelecimentos(nome)")
    .eq("id", id)
    .single();
  if (!ticket) notFound();

  const { data: mensagens } = await supabase
    .from("tickets_suporte_mensagens")
    .select("id, mensagem, created_at, usuarios(nome)")
    .eq("ticket_id", id)
    .order("created_at");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/suporte" className="text-sm text-cinza-600 underline">
        ← Suporte
      </Link>
      <div>
        <Heading>{ticket.assunto}</Heading>
        <Link href={`/admin/estabelecimentos/${ticket.estabelecimento_id}`} className="text-sm text-cinza-600 underline">
          {ticket.estabelecimentos?.nome}
        </Link>
      </div>

      <TicketThread
        mensagens={(mensagens ?? []).map((m) => ({
          id: m.id,
          autorNome: m.usuarios?.nome ?? "—",
          mensagem: m.mensagem,
          criadoEm: m.created_at,
        }))}
        enviarMensagem={responderTicketAdmin.bind(null, id)}
        statusAtual={ticket.status}
        statusLabel={STATUS_LABEL[ticket.status]}
        opcoesStatus={[
          { valor: "aberto", label: "Marcar como aberto" },
          { valor: "em_andamento", label: "Marcar em andamento" },
          { valor: "resolvido", label: "Marcar como resolvido" },
        ]}
        onAlterarStatus={async (novoStatus) => {
          "use server";
          await alterarStatusTicketAdmin(id, novoStatus as "aberto" | "em_andamento" | "resolvido");
        }}
      />
    </div>
  );
}
