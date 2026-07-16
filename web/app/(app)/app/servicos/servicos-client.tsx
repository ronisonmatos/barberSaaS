"use client";

import { useState, useTransition } from "react";
import { Scissors } from "lucide-react";
import { ServicoForm } from "./servico-form";
import { alternarAtivoServico } from "./actions";
import { centavosToBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

export function ServicosClient({ servicos }: { servicos: Servico[] }) {
  const [editando, setEditando] = useState<Servico | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <ServicoForm
          key={editando === "novo" ? "novo" : editando.id}
          servico={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit text-sm">
          Novo serviço
        </Button>
      )}

      {servicos.length === 0 ? (
        <EmptyState
          icon={Scissors}
          titulo="Nenhum serviço cadastrado ainda"
          descricao="Use o botão acima para cadastrar o primeiro serviço."
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-linha text-left text-cinza-600">
              <th className="py-2 font-medium">Nome</th>
              <th className="font-medium">Duração</th>
              <th className="font-medium">Preço</th>
              <th className="font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((s) => (
              <tr key={s.id} className="border-b border-linha text-carvao hover:bg-marfim">
                <td className="py-2">{s.nome}</td>
                <td>{s.duracao_minutos}min</td>
                <td className="tabular-nums">{centavosToBRL(s.preco_centavos)}</td>
                <td className={s.ativo ? "text-sucesso" : "text-cinza-600"}>
                  {s.ativo ? "Ativo" : "Inativo"}
                </td>
                <td className="flex gap-2 py-2 text-right">
                  <Button variant="ghost" onClick={() => setEditando(s)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => startTransition(() => alternarAtivoServico(s.id, !s.ativo))}
                  >
                    {s.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
