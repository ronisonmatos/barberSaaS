"use client";

import { useActionState } from "react";
import { salvarPlano } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import type { Database } from "@/lib/supabase/types";

type Plano = Database["public"]["Tables"]["planos_plataforma"]["Row"];

export function PlanoForm({ plano, onDone }: { plano?: Plano | null; onDone?: () => void }) {
  const [state, action, pending] = useActionState(salvarPlano, undefined);
  const recursos = (plano?.recursos ?? {}) as {
    whatsapp?: boolean;
    relatorios?: boolean;
    pagamento_online?: boolean;
    loja?: boolean;
    suporte?: "limitado" | "prioritario";
  };

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-3 rounded-md border border-linha p-4"
    >
      {plano && <input type="hidden" name="id" value={plano.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <Input name="nome" required defaultValue={plano?.nome} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Preço mensal (R$)</label>
          <Input name="preco" required placeholder="99,00" defaultValue={plano ? (plano.preco_centavos / 100).toFixed(2) : ""} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Máx. profissionais (vazio = ilimitado)</label>
          <Input name="maxProfissionais" type="number" min={1} defaultValue={plano?.max_profissionais ?? ""} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Máx. usuários do painel (vazio = ilimitado)</label>
          <Input name="maxUsuarios" type="number" min={1} defaultValue={plano?.max_usuarios ?? ""} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Máx. fotos da página pública (vazio = ilimitado)</label>
          <Input name="maxFotos" type="number" min={1} defaultValue={plano?.max_fotos ?? ""} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Máx. produtos da loja (vazio = ilimitado)</label>
          <Input name="maxProdutos" type="number" min={0} defaultValue={plano?.max_produtos ?? ""} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Suporte</label>
          <select
            name="suporte"
            defaultValue={recursos.suporte ?? "limitado"}
            className="rounded-md border border-linha bg-marfim-2 px-3 py-2 text-sm text-carvao"
          >
            <option value="limitado">Limitado</option>
            <option value="prioritario">Prioritário</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="whatsapp" defaultChecked={recursos.whatsapp ?? false} />
            WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="relatorios" defaultChecked={recursos.relatorios ?? false} />
            Relatórios
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pagamentoOnline"
              defaultChecked={recursos.pagamento_online ?? false}
            />
            Pagamento online no agendamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="loja" defaultChecked={recursos.loja ?? false} />
            Loja de produtos
          </label>
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {plano && (
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
