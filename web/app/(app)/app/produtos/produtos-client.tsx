"use client";

import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { ProdutoForm } from "./produto-form";
import { alternarAtivoProduto } from "./actions";
import { centavosToBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";

type Produto = Database["public"]["Tables"]["produtos"]["Row"];

export function ProdutosClient({
  produtos,
  limite,
  estabelecimentoSlug,
}: {
  produtos: Produto[];
  limite: number | null;
  estabelecimentoSlug: string;
}) {
  const [editando, setEditando] = useState<Produto | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [erroToggle, setErroToggle] = useState<string | null>(null);

  const ativos = produtos.filter((p) => p.ativo).length;

  function alternar(p: Produto) {
    setErroToggle(null);
    startTransition(async () => {
      const r = await alternarAtivoProduto(p.id, !p.ativo);
      if (r.error) setErroToggle(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cinza-600">
        {ativos} de {limite ?? "∞"} produto{ativos === 1 ? "" : "s"} ativos
      </p>
      {erroToggle && <FormError>{erroToggle}</FormError>}

      {editando ? (
        <ProdutoForm
          key={editando === "novo" ? "novo" : editando.id}
          produto={editando === "novo" ? null : editando}
          estabelecimentoSlug={estabelecimentoSlug}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit text-sm">
          Novo produto
        </Button>
      )}

      {produtos.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          titulo="Nenhum produto cadastrado ainda"
          descricao="Use o botão acima para cadastrar o primeiro produto da loja."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-cinza-600">
                <th className="py-2 font-medium">Nome</th>
                <th className="font-medium">Preço</th>
                <th className="font-medium">Estoque</th>
                <th className="font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">
                    <p>{p.nome}</p>
                    {p.tags.length > 0 && (
                      <p className="text-xs text-cinza-600">{p.tags.join(" · ")}</p>
                    )}
                  </td>
                  <td className="tabular-nums">{centavosToBRL(p.preco_centavos)}</td>
                  <td className="tabular-nums">{p.estoque}</td>
                  <td className={p.ativo ? "text-sucesso" : "text-cinza-600"}>
                    {p.ativo
                      ? "Ativo"
                      : p.desativado_por_limite_plano
                        ? "Desativado (limite do plano)"
                        : "Inativo"}
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
