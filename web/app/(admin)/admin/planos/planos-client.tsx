"use client";

import { useState, useTransition } from "react";
import { PlanoForm } from "./plano-form";
import { alternarAtivoPlano } from "./actions";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

type Plano = Database["public"]["Tables"]["planos_plataforma"]["Row"];

export function PlanosClient({ planos }: { planos: Plano[] }) {
  const [editando, setEditando] = useState<Plano | "novo" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <PlanoForm
          key={editando === "novo" ? "novo" : editando.id}
          plano={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit">
          Novo plano
        </Button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-linha text-left">
            <th className="py-2">Nome</th>
            <th>Preço</th>
            <th>Máx. profissionais</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {planos.map((p) => (
            <tr key={p.id} className="border-b border-linha">
              <td className="py-2">{p.nome}</td>
              <td>{centavosToBRL(p.preco_centavos)}</td>
              <td>{p.max_profissionais ?? "Ilimitado"}</td>
              <td>{p.ativo ? "Ativo" : "Inativo"}</td>
              <td className="flex gap-2 py-2 text-right">
                <button className="underline" onClick={() => setEditando(p)}>
                  Editar
                </button>
                <button
                  disabled={isPending}
                  className="underline"
                  onClick={() => startTransition(() => alternarAtivoPlano(p.id, !p.ativo))}
                >
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
          {planos.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-cinza-600">
                Nenhum plano cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
