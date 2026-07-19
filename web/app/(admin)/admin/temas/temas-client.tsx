"use client";

import { useState, useTransition } from "react";
import { TemaForm } from "./tema-form";
import { alternarAtivoTema } from "./actions";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

type Tema = Database["public"]["Tables"]["temas_plataforma"]["Row"];

export function TemasClient({ temas }: { temas: Tema[] }) {
  const [editando, setEditando] = useState<Tema | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <TemaForm
          key={editando === "novo" ? "novo" : editando.id}
          tema={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit">
          Novo tema
        </Button>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-linha text-left">
              <th className="py-2">Nome</th>
              <th>Chave</th>
              <th>Preço</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {temas.map((t) => (
              <tr key={t.id} className="border-b border-linha">
                <td className="py-2">{t.nome}</td>
                <td className="text-cinza-600">{t.chave}</td>
                <td>{centavosToBRL(t.preco_centavos)}</td>
                <td>{t.ativo ? "Ativo" : "Inativo"}</td>
                <td className="flex gap-2 py-2 text-right">
                  <button className="underline" onClick={() => setEditando(t)}>
                    Editar
                  </button>
                  <button
                    disabled={isPending}
                    className="underline"
                    onClick={() => startTransition(() => alternarAtivoTema(t.id, !t.ativo))}
                  >
                    {t.ativo ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
            {temas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-cinza-600">
                  Nenhum tema cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
