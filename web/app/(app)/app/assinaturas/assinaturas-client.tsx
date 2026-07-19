"use client";

import { useState, useTransition } from "react";
import { cancelarAssinatura } from "./actions";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export type AssinaturaDetalhada = {
  id: string;
  status: "pendente" | "ativa" | "inadimplente" | "cancelada" | "pausada";
  cicloInicio: string;
  cicloFim: string;
  usosCiclo: Record<string, number>;
  clienteNome: string;
  clienteTelefone: string;
  planoNome: string;
  planoPrecoCentavos: number;
};

const STATUS_LABEL: Record<AssinaturaDetalhada["status"], string> = {
  pendente: "Aguardando pagamento",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  cancelada: "Cancelada",
  pausada: "Pausada",
};

const STATUS_COR: Record<AssinaturaDetalhada["status"], string> = {
  pendente: "text-aviso",
  ativa: "text-sucesso",
  inadimplente: "text-erro",
  cancelada: "text-cinza-600",
  pausada: "text-cinza-600",
};

export function AssinaturasClient({
  assinaturas,
  podeCancelar,
}: {
  assinaturas: AssinaturaDetalhada[];
  podeCancelar: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function cancelar(id: string) {
    setErro(null);
    setCancelando(id);
    startTransition(async () => {
      const r = await cancelarAssinatura(id);
      if (r.error) setErro(r.error);
      setCancelando(null);
    });
  }

  const totalUsos = (usos: Record<string, number>) => Object.values(usos).reduce((soma, n) => soma + n, 0);

  return (
    <div className="flex flex-col gap-3">
      {erro && <FormError>{erro}</FormError>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-linha text-left text-cinza-600">
              <th className="py-2 font-medium">Cliente</th>
              <th className="font-medium">Plano</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Ciclo até</th>
              <th className="font-medium">Usos no ciclo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assinaturas.map((a) => (
              <tr key={a.id} className="border-b border-linha text-carvao hover:bg-marfim">
                <td className="py-2">
                  <p>{a.clienteNome}</p>
                  <p className="text-xs text-cinza-600">{a.clienteTelefone}</p>
                </td>
                <td>
                  {a.planoNome}
                  <p className="text-xs text-cinza-600 tabular-nums">{centavosToBRL(a.planoPrecoCentavos)}/mês</p>
                </td>
                <td className={STATUS_COR[a.status]}>{STATUS_LABEL[a.status]}</td>
                <td className="tabular-nums">
                  {a.status === "pendente" ? "—" : new Date(a.cicloFim).toLocaleDateString("pt-BR")}
                </td>
                <td className="tabular-nums">{totalUsos(a.usosCiclo)}</td>
                <td className="py-2 text-right">
                  {podeCancelar && a.status !== "cancelada" && (
                    <Button
                      variant="perigo"
                      disabled={pending}
                      onClick={() => cancelar(a.id)}
                    >
                      {cancelando === a.id ? "Cancelando..." : "Cancelar"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
