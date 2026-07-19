"use client";

import { useActionState, useState } from "react";
import { salvarProgramaFidelidade } from "./actions";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Programa = Database["public"]["Tables"]["programas_fidelidade"]["Row"];
type OpcaoNome = { id: string; nome: string };

const SELECT_CLASS =
  "h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-sm text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30";

export function ProgramaFidelidadeForm({
  programa,
  servicos,
  produtos,
  onDone,
}: {
  programa?: Programa | null;
  servicos: OpcaoNome[];
  produtos: OpcaoNome[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarProgramaFidelidade, undefined);
  const [brindeTipo, setBrindeTipo] = useState<"servico" | "produto">(
    (programa?.brinde_tipo as "servico" | "produto") ?? "servico"
  );

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-4 rounded-md border border-linha bg-marfim-2 p-4"
    >
      {programa && <input type="hidden" name="id" value={programa.id} />}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nome do programa</label>
        <Input name="nome" required defaultValue={programa?.nome ?? ""} placeholder="Ex: Corte grátis a cada 10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Serviço que conta selo</label>
          <select
            name="servicoId"
            required
            defaultValue={programa?.servico_id ?? ""}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Selecione
            </option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <p className="text-xs text-cinza-600">
            Só conta selo quando um agendamento desse serviço exato é marcado concluído.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Selos para completar</label>
          <Input
            name="selosNecessarios"
            type="number"
            min={2}
            max={50}
            required
            defaultValue={programa?.selos_necessarios ?? 10}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Brinde</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="brindeTipo"
              value="servico"
              checked={brindeTipo === "servico"}
              onChange={() => setBrindeTipo("servico")}
            />
            Um serviço
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="brindeTipo"
              value="produto"
              checked={brindeTipo === "produto"}
              onChange={() => setBrindeTipo("produto")}
            />
            Um produto
          </label>
        </div>
        {brindeTipo === "servico" ? (
          <select
            name="brindeServicoId"
            required
            defaultValue={programa?.brinde_servico_id ?? ""}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Selecione o serviço do brinde
            </option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        ) : produtos.length === 0 ? (
          <p className="text-xs text-cinza-600">
            Nenhum produto ativo cadastrado — crie um em Produtos antes de usar como brinde.
          </p>
        ) : (
          <select
            name="brindeProdutoId"
            required
            defaultValue={programa?.brinde_produto_id ?? ""}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Selecione o produto do brinde
            </option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="ativo" defaultChecked={programa?.ativo ?? true} />
        Ativo (concede selos)
      </label>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {programa && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
