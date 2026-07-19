"use client";

import { useState, useTransition } from "react";
import { Award } from "lucide-react";
import { ProgramaFidelidadeForm } from "./programa-form";
import { alternarAtivoPrograma } from "./actions";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";

type Programa = Database["public"]["Tables"]["programas_fidelidade"]["Row"];
type OpcaoNome = { id: string; nome: string };

export function ProgramasFidelidadeClient({
  programas,
  servicos,
  produtos,
}: {
  programas: Programa[];
  servicos: OpcaoNome[];
  produtos: OpcaoNome[];
}) {
  const [editando, setEditando] = useState<Programa | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [erroToggle, setErroToggle] = useState<string | null>(null);

  const nomeServico = (id: string) => servicos.find((s) => s.id === id)?.nome ?? "Serviço removido";
  const nomeBrinde = (p: Programa) =>
    p.brinde_tipo === "servico"
      ? (servicos.find((s) => s.id === p.brinde_servico_id)?.nome ?? "Serviço removido")
      : (produtos.find((pr) => pr.id === p.brinde_produto_id)?.nome ?? "Produto removido");

  function alternar(p: Programa) {
    setErroToggle(null);
    startTransition(async () => {
      const r = await alternarAtivoPrograma(p.id, !p.ativo);
      if (r.error) setErroToggle(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {erroToggle && <FormError>{erroToggle}</FormError>}

      {editando ? (
        <ProgramaFidelidadeForm
          key={editando === "novo" ? "novo" : editando.id}
          programa={editando === "novo" ? null : editando}
          servicos={servicos}
          produtos={produtos}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button
          onClick={() => setEditando("novo")}
          disabled={servicos.length === 0}
          className="w-fit text-sm"
        >
          Novo programa
        </Button>
      )}
      {servicos.length === 0 && !editando && (
        <p className="text-xs text-cinza-600">Cadastre ao menos um serviço ativo antes de criar um programa.</p>
      )}

      {programas.length === 0 ? (
        <EmptyState
          icon={Award}
          titulo="Nenhum programa de fidelidade ainda"
          descricao="Use o botão acima para criar o primeiro programa."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-cinza-600">
                <th className="py-2 font-medium">Programa</th>
                <th className="font-medium">Serviço</th>
                <th className="font-medium">Selos</th>
                <th className="font-medium">Brinde</th>
                <th className="font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {programas.map((p) => (
                <tr key={p.id} className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">{p.nome}</td>
                  <td>{nomeServico(p.servico_id)}</td>
                  <td className="tabular-nums">{p.selos_necessarios}</td>
                  <td>{nomeBrinde(p)}</td>
                  <td className={p.ativo ? "text-sucesso" : "text-cinza-600"}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </td>
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
