import Link from "next/link";
import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type StatusEstabelecimento = Database["public"]["Enums"]["status_estabelecimento"];

const STATUS_LABEL: Record<StatusEstabelecimento, string> = {
  trial: "Trial",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

const STATUS_COR: Record<StatusEstabelecimento, string> = {
  trial: "text-latao-escuro",
  ativa: "text-sucesso",
  inadimplente: "text-aviso",
  suspensa: "text-erro",
  cancelada: "text-cinza-600",
};

function diasRestantes(expiraEm: string | null): string {
  if (!expiraEm) return "—";
  const dias = Math.max(0, Math.ceil((new Date(expiraEm).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

export default async function AdminEstabelecimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await getSuperAdmin();
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("estabelecimentos")
    .select("id, nome, slug, status, trial_ate, rascunho, rascunho_expira_em, planos_plataforma(nome)")
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(`nome.ilike.%${params.q}%,slug.ilike.%${params.q}%`);
  }
  const statusValido = (Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).find(
    (s) => s === params.status
  );
  if (statusValido) {
    query = query.eq("status", statusValido);
  }

  const { data: estabelecimentos } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-carvao">Estabelecimentos</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/estabelecimentos/rascunho/novo"
            className="inline-flex h-11 items-center justify-center rounded-md border border-linha px-4 font-medium text-carvao hover:bg-marfim"
          >
            Criar página de demonstração
          </Link>
          <Link
            href="/admin/estabelecimentos/novo"
            className="inline-flex h-11 items-center justify-center rounded-md bg-latao px-4 font-medium text-carvao hover:bg-latao-escuro"
          >
            Cadastrar manualmente
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/estabelecimentos">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por nome ou endereço"
          className="h-11 flex-1 rounded-md border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-11 rounded-md border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-md border border-linha px-4 text-sm font-medium text-carvao hover:bg-marfim"
        >
          Filtrar
        </button>
      </form>

      {estabelecimentos && estabelecimentos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left">
                <th className="py-2">Nome</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Trial até</th>
              </tr>
            </thead>
            <tbody>
              {estabelecimentos.map((e) => (
                <tr key={e.id} className="border-b border-linha">
                  <td className="py-2">
                    <Link href={`/admin/estabelecimentos/${e.id}`} className="font-medium text-carvao underline">
                      {e.nome}
                    </Link>
                  </td>
                  <td className="text-cinza-600">/b/{e.slug}</td>
                  <td className={`font-medium ${e.rascunho ? "text-latao-escuro" : STATUS_COR[e.status]}`}>
                    {e.rascunho ? `Rascunho (${diasRestantes(e.rascunho_expira_em)})` : STATUS_LABEL[e.status]}
                  </td>
                  <td>{e.planos_plataforma?.nome ?? "—"}</td>
                  <td>{e.trial_ate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          titulo="Nenhum estabelecimento encontrado"
          descricao="Ajuste a busca/filtro ou cadastre um estabelecimento manualmente."
        />
      )}
    </div>
  );
}
