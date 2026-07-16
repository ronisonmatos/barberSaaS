import Link from "next/link";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

const STATUS_COR: Record<string, string> = {
  aberto: "text-aviso",
  em_andamento: "text-latao-escuro",
  resolvido: "text-sucesso",
};

export default async function SuportePage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets_suporte")
    .select("id, assunto, status, created_at")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-carvao">Suporte</h1>
        <Link href="/app/suporte/novo">
          <Button>Abrir chamado</Button>
        </Link>
      </div>

      {tickets && tickets.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-linha text-left">
              <th className="py-2">Assunto</th>
              <th>Status</th>
              <th>Aberto em</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-linha">
                <td className="py-2">
                  <Link href={`/app/suporte/${t.id}`} className="text-carvao underline">
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
        <EmptyState
          icon={MessageCircle}
          titulo="Nenhum chamado aberto"
          descricao="Precisa de ajuda? Abra um chamado e a gente responde por aqui."
          acao={{ label: "Abrir chamado", href: "/app/suporte/novo" }}
        />
      )}
    </div>
  );
}
