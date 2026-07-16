import { Building2, TrendingUp, AlertTriangle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";
import { StatTile } from "@/components/ui/stat-tile";
import { centavosToBRL } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

function isoHaDias(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminOverviewPage() {
  await getSuperAdmin();
  const supabase = await createClient();

  const { data: estabelecimentos } = await supabase
    .from("estabelecimentos")
    .select("id, status, plano_plataforma_id, planos_plataforma(preco_centavos)");

  const lista = estabelecimentos ?? [];
  const porStatus = {
    trial: lista.filter((e) => e.status === "trial").length,
    ativa: lista.filter((e) => e.status === "ativa").length,
    inadimplente: lista.filter((e) => e.status === "inadimplente").length,
    suspensa: lista.filter((e) => e.status === "suspensa").length,
    cancelada: lista.filter((e) => e.status === "cancelada").length,
  };

  const mrrEstimadoCentavos = lista
    .filter((e) => e.status === "ativa" || e.status === "trial")
    .reduce((soma, e) => soma + (e.planos_plataforma?.preco_centavos ?? 0), 0);

  const { count: cancelamentos30d } = await supabase
    .from("eventos_admin")
    .select("id", { count: "exact", head: true })
    .eq("tipo", "status_alterado")
    .eq("detalhes->>para", "cancelada")
    .gte("created_at", isoHaDias(30));

  return (
    <div className="flex flex-col gap-6">
      <Heading>Visão geral</Heading>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Trial" value={porStatus.trial} icon={Building2} colorClassName="text-latao-escuro" />
        <StatTile label="Ativas" value={porStatus.ativa} icon={TrendingUp} colorClassName="text-sucesso" />
        <StatTile label="Inadimplentes" value={porStatus.inadimplente} icon={AlertTriangle} colorClassName="text-aviso" />
        <StatTile label="Suspensas/canceladas" value={porStatus.suspensa + porStatus.cancelada} icon={XCircle} colorClassName="text-erro" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium text-cinza-600">MRR estimado</p>
          <p className="font-display text-3xl text-carvao">{centavosToBRL(mrrEstimadoCentavos)}</p>
          <p className="text-xs text-cinza-300">
            Soma do plano das estabelecimentos ativas/trial — não é cobrança real ainda (Asaas pendente).
          </p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium text-cinza-600">Cancelamentos (últimos 30 dias)</p>
          <p className="font-display text-3xl text-carvao">{cancelamentos30d ?? 0}</p>
          <p className="text-xs text-cinza-300">
            Baseado nas ações manuais de cancelamento registradas — hoje é o único jeito de cancelar.
          </p>
        </Card>
      </div>
    </div>
  );
}
