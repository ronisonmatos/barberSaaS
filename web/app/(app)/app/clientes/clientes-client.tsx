"use client";

import { useState } from "react";
import { ClienteForm } from "./cliente-form";
import { formatPhoneBR } from "@/lib/phone";
import type { Database } from "@/lib/supabase/types";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function ClientesClient({
  clientes,
  slugBarbearia,
  appUrl,
}: {
  clientes: Cliente[];
  slugBarbearia: string;
  appUrl: string;
}) {
  const [editando, setEditando] = useState<Cliente | "novo" | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const linkGerenciamento = (token: string) =>
    `${appUrl}/b/${slugBarbearia}/meus-agendamentos/${token}`;

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <ClienteForm
          key={editando === "novo" ? "novo" : editando.id}
          cliente={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <button
          onClick={() => setEditando("novo")}
          className="w-fit rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Novo cliente
        </button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <th className="py-2">Nome</th>
            <th>Telefone</th>
            <th>E-mail</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2">{c.nome}</td>
              <td>{formatPhoneBR(c.telefone)}</td>
              <td>{c.email}</td>
              <td className="flex gap-2 py-2 text-right">
                <button className="underline" onClick={() => setEditando(c)}>
                  Editar
                </button>
                <button
                  className="underline"
                  onClick={() => {
                    navigator.clipboard.writeText(linkGerenciamento(c.token_acesso));
                    setCopiadoId(c.id);
                    setTimeout(() => setCopiadoId(null), 2000);
                  }}
                >
                  {copiadoId === c.id ? "Copiado!" : "Copiar link"}
                </button>
              </td>
            </tr>
          ))}
          {clientes.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-neutral-500">
                Nenhum cliente cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
