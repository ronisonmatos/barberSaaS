"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { ClienteForm } from "./cliente-form";
import { formatPhoneBR } from "@/lib/phone";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function ClientesClient({
  clientes,
  slugEstabelecimento,
  appUrl,
}: {
  clientes: Cliente[];
  slugEstabelecimento: string;
  appUrl: string;
}) {
  const [editando, setEditando] = useState<Cliente | "novo" | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const linkGerenciamento = (token: string) =>
    `${appUrl}/b/${slugEstabelecimento}/meus-agendamentos/${token}`;

  return (
    <div className="flex flex-col gap-4">
      {editando ? (
        <ClienteForm
          key={editando === "novo" ? "novo" : editando.id}
          cliente={editando === "novo" ? null : editando}
          onDone={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("novo")} className="w-fit text-sm">
          Novo cliente
        </Button>
      )}

      {clientes.length === 0 ? (
        <EmptyState icon={Users} titulo="Nenhum cliente cadastrado ainda" descricao="Use o botão acima para cadastrar o primeiro cliente." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-cinza-600">
                <th className="py-2 font-medium">Nome</th>
                <th className="font-medium">Telefone</th>
                <th className="font-medium">E-mail</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">{c.nome}</td>
                  <td>{formatPhoneBR(c.telefone)}</td>
                  <td>{c.email}</td>
                  <td className="flex gap-2 py-2 text-right">
                    <Button variant="ghost" onClick={() => setEditando(c)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(linkGerenciamento(c.token_acesso));
                        setCopiadoId(c.id);
                        setTimeout(() => setCopiadoId(null), 2000);
                      }}
                    >
                      {copiadoId === c.id ? "Link copiado" : "Copiar link"}
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
