"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { salvarPlanoClubeRascunho } from "./actions";
import { centavosParaCampoBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type PlanoClube = Database["public"]["Tables"]["planos_estabelecimento"]["Row"];
type Servico = { id: string; nome: string };
type Regra = { servico_id: string; quantidade_mes: number };
type RegraForm = { servicoId: string; quantidadeMes: number };

const SELECT_CLASS =
  "h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-sm text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30";

export function PlanoClubeFormRascunho({
  estabelecimentoId,
  plano,
  servicos,
  onDone,
}: {
  estabelecimentoId: string;
  plano?: PlanoClube | null;
  servicos: Servico[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarPlanoClubeRascunho, undefined);
  const [regras, setRegras] = useState<RegraForm[]>(
    ((plano?.regras as Regra[] | null) ?? []).map((r) => ({ servicoId: r.servico_id, quantidadeMes: r.quantidade_mes }))
  );

  function adicionarRegra() {
    setRegras((prev) => [...prev, { servicoId: servicos[0]?.id ?? "", quantidadeMes: 1 }]);
  }

  function removerRegra(indice: number) {
    setRegras((prev) => prev.filter((_, i) => i !== indice));
  }

  function atualizarRegra(indice: number, campo: keyof RegraForm, valor: string | number) {
    setRegras((prev) => prev.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)));
  }

  return (
    <form
      action={async (formData) => {
        formData.set("regras", JSON.stringify(regras));
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-4 rounded-md border border-linha bg-marfim-2 p-4"
    >
      <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />
      {plano && <input type="hidden" name="id" value={plano.id} />}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nome do plano</label>
        <Input name="nome" required defaultValue={plano?.nome ?? ""} placeholder="Ex: Clube do Corte" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Preço mensal (R$)</label>
          <Input
            name="preco"
            required
            defaultValue={plano ? centavosParaCampoBRL(plano.preco_centavos) : ""}
            placeholder="80,00"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Descrição (opcional)</label>
          <Input name="descricao" defaultValue={plano?.descricao ?? ""} placeholder="Ex: para quem corta toda semana" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">O que o plano cobre</label>
        {regras.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={r.servicoId}
              onChange={(e) => atualizarRegra(i, "servicoId", e.target.value)}
              className={`${SELECT_CLASS} flex-1`}
            >
              <option value="" disabled>
                Selecione o serviço
              </option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              max={60}
              value={r.quantidadeMes}
              onChange={(e) => atualizarRegra(i, "quantidadeMes", Number(e.target.value))}
              className="w-24"
            />
            <span className="shrink-0 text-xs text-cinza-600">por mês</span>
            <button
              type="button"
              onClick={() => removerRegra(i)}
              aria-label="Remover"
              className="text-cinza-600 hover:text-erro"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
        <Button type="button" variant="secondary" className="w-fit text-sm" onClick={adicionarRegra}>
          + Adicionar serviço
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="ativo" defaultChecked={plano?.ativo ?? true} />
        Ativo (visível na página pública)
      </label>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {plano && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
