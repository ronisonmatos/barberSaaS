"use client";

import { useActionState, useTransition } from "react";
import { Ban } from "lucide-react";
import { criarBloqueio, excluirBloqueio } from "./actions";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { EmptyState } from "@/components/ui/empty-state";

type Bloqueio = Database["public"]["Tables"]["bloqueios"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function BloqueiosClient({
  bloqueios,
  profissionais,
}: {
  bloqueios: Bloqueio[];
  profissionais: Profissional[];
}) {
  const [state, action, pending] = useActionState(criarBloqueio, undefined);
  const [isPending, startTransition] = useTransition();

  const nomeProfissional = (id: string | null) =>
    id ? profissionais.find((p) => p.id === id)?.nome ?? "—" : "Estabelecimento inteiro";

  return (
    <div className="flex flex-col gap-4">
      <form
        action={action}
        className="flex flex-wrap items-end gap-3 rounded-md border border-linha bg-marfim-2 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Profissional</label>
          <select
            name="profissional_id"
            className="h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          >
            <option value="">Estabelecimento inteiro</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Início</label>
          <Input type="datetime-local" name="inicio" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Fim</label>
          <Input type="datetime-local" name="fim" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Motivo</label>
          <Input name="motivo" />
        </div>
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Adicionar bloqueio"}
        </Button>
        {state?.error && <FormError className="w-full">{state.error}</FormError>}
      </form>

      {bloqueios.length === 0 ? (
        <EmptyState icon={Ban} titulo="Nenhum bloqueio cadastrado" descricao="Use o formulário acima para bloquear um período." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-linha text-left text-cinza-600">
              <th className="py-2 font-medium">Profissional</th>
              <th className="font-medium">Início</th>
              <th className="font-medium">Fim</th>
              <th className="font-medium">Motivo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bloqueios.map((b) => (
              <tr key={b.id} className="border-b border-linha text-carvao hover:bg-marfim">
                <td className="py-2">{nomeProfissional(b.profissional_id)}</td>
                <td>{formatarDataHora(b.inicio)}</td>
                <td>{formatarDataHora(b.fim)}</td>
                <td>{b.motivo}</td>
                <td className="text-right">
                  <Button
                    variant="perigo"
                    disabled={isPending}
                    onClick={() => startTransition(() => excluirBloqueio(b.id))}
                  >
                    Excluir
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
