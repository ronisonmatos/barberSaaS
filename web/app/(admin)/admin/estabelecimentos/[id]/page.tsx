import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { centavosToBRL } from "@/lib/money";
import { EstabelecimentoAcoes } from "./estabelecimento-acoes";

const STATUS_LABEL: Record<string, string> = {
  trial: "Trial",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

export default async function AdminEstabelecimentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase.from("estabelecimentos").select("*").eq("id", id).single();
  if (!estabelecimento) notFound();

  const [
    { data: membros },
    { data: planos },
    { count: totalAgendamentos },
    { count: totalClientes },
    { count: totalProfissionais },
    { data: tickets },
    { data: assinatura },
    { data: pagamentosPlataforma },
  ] = await Promise.all([
    supabase.from("membros_estabelecimento").select("papel, usuarios(nome)").eq("estabelecimento_id", id),
    supabase.from("planos_plataforma").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("agendamentos").select("id", { count: "exact", head: true }).eq("estabelecimento_id", id),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("estabelecimento_id", id),
    supabase.from("profissionais").select("id", { count: "exact", head: true }).eq("estabelecimento_id", id),
    supabase
      .from("tickets_suporte")
      .select("id, assunto, status, created_at")
      .eq("estabelecimento_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("assinaturas_plataforma")
      .select("status, proximo_vencimento")
      .eq("estabelecimento_id", id)
      .maybeSingle(),
    supabase
      .from("pagamentos_plataforma")
      .select("id, valor_centavos, metodo, status, pago_em, created_at, planos_plataforma(nome)")
      .eq("estabelecimento_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/estabelecimentos" className="text-sm text-cinza-600 underline">
          ← Estabelecimentos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Heading>{estabelecimento.nome}</Heading>
          <span className="text-sm font-medium text-carvao">{STATUS_LABEL[estabelecimento.status]}</span>
        </div>
        <p className="text-sm text-cinza-600">/b/{estabelecimento.slug}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium text-cinza-600">Agendamentos</p>
          <p className="font-display text-3xl text-carvao">{totalAgendamentos ?? 0}</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium text-cinza-600">Clientes</p>
          <p className="font-display text-3xl text-carvao">{totalClientes ?? 0}</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium text-cinza-600">Profissionais</p>
          <p className="font-display text-3xl text-carvao">{totalProfissionais ?? 0}</p>
        </Card>
      </div>

      <Card className="p-4">
        <Heading as="h2" className="mb-4">
          Ações administrativas
        </Heading>
        <EstabelecimentoAcoes
          estabelecimentoId={estabelecimento.id}
          ativacaoManual={estabelecimento.ativacao_manual}
          planos={planos ?? []}
          planoAtualId={estabelecimento.plano_plataforma_id}
        />
      </Card>

      <Card className="p-4">
        <Heading as="h2" className="mb-4">
          Assinatura
        </Heading>
        <p className="text-sm text-cinza-600">Próximo vencimento</p>
        <p className="mb-4 font-display text-2xl text-carvao">
          {assinatura?.proximo_vencimento
            ? new Date(`${assinatura.proximo_vencimento}T00:00:00`).toLocaleDateString("pt-BR")
            : "—"}
        </p>
        <p className="mb-2 text-sm font-medium text-cinza-600">Histórico de cobranças</p>
        <ul className="flex flex-col gap-1 text-sm">
          {(pagamentosPlataforma ?? []).map((p) => (
            <li key={p.id} className="text-carvao">
              {new Date(p.created_at).toLocaleDateString("pt-BR")} — {p.planos_plataforma?.nome} —{" "}
              {centavosToBRL(p.valor_centavos)} ({p.metodo}) —{" "}
              <span className="text-cinza-600">{p.status}</span>
            </li>
          ))}
          {(!pagamentosPlataforma || pagamentosPlataforma.length === 0) && (
            <p className="text-cinza-600">Nenhuma cobrança de assinatura ainda.</p>
          )}
        </ul>
      </Card>

      <Card className="p-4">
        <Heading as="h2" className="mb-4">
          Membros
        </Heading>
        <ul className="flex flex-col gap-1 text-sm">
          {(membros ?? []).map((m, i) => (
            <li key={i} className="text-carvao">
              {m.usuarios?.nome} <span className="text-cinza-600">({m.papel})</span>
            </li>
          ))}
          {(!membros || membros.length === 0) && <p className="text-cinza-600">Nenhum membro.</p>}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Heading as="h2">Tickets de suporte</Heading>
          <Link href={`/admin/suporte?estabelecimento=${estabelecimento.id}`} className="text-sm underline">
            Ver todos
          </Link>
        </div>
        <ul className="flex flex-col gap-1 text-sm">
          {(tickets ?? []).slice(0, 5).map((t) => (
            <li key={t.id}>
              <Link href={`/admin/suporte/${t.id}`} className="text-carvao underline">
                {t.assunto}
              </Link>{" "}
              <span className="text-cinza-600">({t.status})</span>
            </li>
          ))}
          {(!tickets || tickets.length === 0) && <p className="text-cinza-600">Nenhum ticket.</p>}
        </ul>
      </Card>
    </div>
  );
}
