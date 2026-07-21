"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { statusPagamentoPlano } from "./actions";

export function AguardandoConfirmacaoAsaas({ pagamentoId }: { pagamentoId: string }) {
  const router = useRouter();
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (confirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await statusPagamentoPlano(pagamentoId);
      if (!ignorar && status?.status === "pago") {
        setConfirmado(true);
        router.refresh();
      }
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [pagamentoId, confirmado, router]);

  return (
    <Card className="border-latao p-4 text-sm text-cinza-600">
      {confirmado ? "Pagamento confirmado! Atualizando..." : "Aguardando confirmação do pagamento pela Asaas..."}
    </Card>
  );
}
