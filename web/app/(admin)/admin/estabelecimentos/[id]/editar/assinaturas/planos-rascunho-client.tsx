"use client";

import { useState, useTransition } from "react";
import { Repeat } from "lucide-react";
import { PlanoClubeFormRascunho } from "./plano-form-rascunho";
import { alternarAtivoPlanoClubeRascunho } from "./actions";
import { centavosToBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";

type PlanoClube = Database["public"]["Tables"]["planos_estabelecimento"]["Row"];
type Servico = { id: string; nome: string };
type Regra = { servico_id: string; quantidade_mes: number };

export function PlanosClubeRascunhoClient({
  estabelecimentoId,
  planos,
  servicos,
}: {
  estabelecimentoId: string;
  planos: PlanoClube[];
  servicos: Servico[];
}) {
  const [editando, setEditando] = useState<PlanoClube | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [erroToggle, setErroToggle] = useState<string | null>(null);

  const nomeServico = (id: string) => servicos.find((s) => s.id === id)?.nome ?? "Serviço removido";
  const resumoRegras = (p: PlanoClube) =>
    ((p.regras as Regra[] | null) ?? []).map((r) => `${r.quantidade_mes}x ${nomeServico(r.servico_id)}`).join(", ");

  function alternar(p: PlanoClube) {
    setErroToggle(null);
    startTransition(async () => {
      const r = await alternarAtivoPlanoClubeRascunho(estabelecimentoId, p.id, !p.ativo);
      if (r.error) setErroToggle(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {erroToggle && <FormError>{erroToggle}</FormError>}

      {editando ? (
        <PlanoClubeFormRascunho
          key={editando === "novo" ? "novo" : editando.id}
          estabelecimentoId={estabelecimentoId}
          plano={editando === "novo" ? null : editando}
          servicos={servicos}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} disabled={servicos.length === 0} className="w-fit text-sm">
          Novo plano
        </Button>
      )}
      {servicos.length === 0 && !editando && (
        <p className="text-xs text-cinza-600">Cadastre ao menos um serviço ativo antes de criar um plano.</p>
      )}

      {planos.length === 0 ? (
        <EmptyState
          icon={Repeat}
          titulo="Nenhum plano de assinatura ainda"
          descricao="Use o botão acima para criar o primeiro plano."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-cinza-600">
                <th className="py-2 font-medium">Plano</th>
                <th className="font-medium">Preço/mês</th>
                <th className="font-medium">Cobre</th>
                <th className="font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {planos.map((p) => (
                <tr key={p.id} className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">{p.nome}</td>
                  <td className="tabular-nums">{centavosToBRL(p.preco_centavos)}</td>
                  <td>{resumoRegras(p)}</td>
                  <td className={p.ativo ? "text-sucesso" : "text-cinza-600"}>{p.ativo ? "Ativo" : "Inativo"}</td>
                  <td className="flex gap-2 py-2 text-right">
                    <Button variant="ghost" onClick={() => setEditando(p)}>
                      Editar
                    </Button>
                    <Button variant="ghost" disabled={isPending} onClick={() => alternar(p)}>
                      {p.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
