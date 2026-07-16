"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { alterarStatusEstabelecimento, liberarControleAutomatico, alterarPlanoEstabelecimento } from "./actions";
import { Button } from "@/components/ui/button";

type StatusEstabelecimento = "trial" | "ativa" | "inadimplente" | "suspensa" | "cancelada";

const OPCOES_STATUS: { valor: StatusEstabelecimento; label: string }[] = [
  { valor: "ativa", label: "Ativar" },
  { valor: "suspensa", label: "Suspender" },
  { valor: "cancelada", label: "Cancelar" },
];

export function EstabelecimentoAcoes({
  estabelecimentoId,
  ativacaoManual,
  planos,
  planoAtualId,
}: {
  estabelecimentoId: string;
  ativacaoManual: boolean;
  planos: { id: string; nome: string }[];
  planoAtualId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-cinza-600">Status manual</p>
        <div className="flex flex-wrap gap-2">
          {OPCOES_STATUS.map((opcao) => (
            <Button
              key={opcao.valor}
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await alterarStatusEstabelecimento(estabelecimentoId, opcao.valor);
                  router.refresh();
                })
              }
            >
              {opcao.label}
            </Button>
          ))}
        </div>
        {ativacaoManual && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await liberarControleAutomatico(estabelecimentoId);
                router.refresh();
              })
            }
            className="mt-2 text-sm text-cinza-600 underline hover:text-carvao"
          >
            Devolver controle automático (webhook volta a poder mudar o status)
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-cinza-600">Plano da plataforma</p>
        <select
          defaultValue={planoAtualId ?? ""}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              await alterarPlanoEstabelecimento(estabelecimentoId, e.target.value);
              router.refresh();
            })
          }
          className="h-11 rounded-md border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
        >
          <option value="">Sem plano</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
