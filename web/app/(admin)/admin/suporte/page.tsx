import Link from "next/link";
import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageCircle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type StatusTicket = Database["public"]["Enums"]["status_ticket"];

const STATUS_LABEL: Record<StatusTicket, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

const STATUS_COR: Record<StatusTicket, string> = {
  aberto: "text-aviso",
  em_andamento: "text-latao-escuro",
  resolvido: "text-sucesso",
};

export default async function AdminSuportePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; estabelecimento?: string }>;
}) {
  await getSuperAdmin();
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("tickets_suporte")
    .select("id, assunto, status, created_at, estabelecimentos(nome)")
    .order("created_at", { ascending: false });

  const statusValido = (Object.keys(STATUS_LABEL) as StatusTicket[]).find((s) => s === params.status);
  if (statusValido) query = query.eq("status", statusValido);
  if (params.estabelecimento) query = query.eq("estabelecimento_id", params.estabelecimento);

  const { data: tickets } = await query;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-carvao">Suporte</h1>

      <form className="flex gap-2" action="/admin/suporte">
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

      {tickets && tickets.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-linha text-left">
              <th className="py-2">Estabelecimento</th>
              <th>Assunto</th>
              <th>Status</th>
              <th>Aberto em</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-linha">
                <td className="py-2">{t.estabelecimentos?.nome}</td>
                <td>
                  <Link href={`/admin/suporte/${t.id}`} className="text-carvao underline">
                    {t.assunto}
                  </Link>
                </td>
                <td className={`font-medium ${STATUS_COR[t.status]}`}>{STATUS_LABEL[t.status]}</td>
                <td>{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState icon={MessageCircle} titulo="Nenhum ticket encontrado" />
      )}
    </div>
  );
}
