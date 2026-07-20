"use client";

import { useState, useTransition } from "react";
import { Package } from "lucide-react";
import { ProdutoFormRascunho } from "./produto-form-rascunho";
import { alternarAtivoProdutoRascunho } from "./actions";
import { centavosToBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Produto = Database["public"]["Tables"]["produtos"]["Row"];

export function ProdutosRascunhoClient({
  estabelecimentoId,
  produtos,
}: {
  estabelecimentoId: string;
  produtos: Produto[];
}) {
  const [editando, setEditando] = useState<Produto | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <ProdutoFormRascunho
          key={editando === "novo" ? "novo" : editando.id}
          estabelecimentoId={estabelecimentoId}
          produto={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit text-sm">
          Novo produto
        </Button>
      )}

      {produtos.length === 0 ? (
        <EmptyState
          icon={Package}
          titulo="Nenhum produto cadastrado ainda"
          descricao="Use o botão acima para cadastrar o primeiro produto."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-cinza-600">
                <th className="py-2 font-medium">Nome</th>
                <th className="font-medium">Preço</th>
                <th className="font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">{p.nome}</td>
                  <td className="tabular-nums">{centavosToBRL(p.preco_centavos)}</td>
                  <td className={p.ativo ? "text-sucesso" : "text-cinza-600"}>{p.ativo ? "Ativo" : "Inativo"}</td>
                  <td className="flex gap-2 py-2 text-right">
                    <Button variant="ghost" onClick={() => setEditando(p)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => alternarAtivoProdutoRascunho(estabelecimentoId, p.id, !p.ativo))
                      }
                    >
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
