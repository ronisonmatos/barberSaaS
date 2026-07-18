"use client";

import { useActionState } from "react";
import { salvarPoliticaAgendamento } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function PoliticaAgendamentoForm({
  antecedenciaMinHorasAtual,
  antecedenciaCancelamentoHorasAtual,
  antecedenciaRemarcacaoHorasAtual,
}: {
  antecedenciaMinHorasAtual: number;
  antecedenciaCancelamentoHorasAtual: number;
  antecedenciaRemarcacaoHorasAtual: number;
}) {
  const [state, action, pending] = useActionState(salvarPoliticaAgendamento, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="antecedenciaMinHoras" className="text-sm font-medium">
          Antecedência mínima para agendar (horas)
        </label>
        <Input
          id="antecedenciaMinHoras"
          name="antecedenciaMinHoras"
          type="number"
          min={0}
          step="0.5"
          className="max-w-40"
          defaultValue={antecedenciaMinHorasAtual}
        />
        <p className="text-xs text-cinza-600">
          O cliente não consegue agendar horários com menos de X horas de antecedência.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="antecedenciaCancelamentoHoras" className="text-sm font-medium">
          Prazo para cancelar sem restrição (horas)
        </label>
        <Input
          id="antecedenciaCancelamentoHoras"
          name="antecedenciaCancelamentoHoras"
          type="number"
          min={0}
          step="0.5"
          className="max-w-40"
          defaultValue={antecedenciaCancelamentoHorasAtual}
        />
        <p className="text-xs text-cinza-600">
          0 = sem restrição. Cancelamentos feitos com menos antecedência que isso (ou não
          comparecimento) ficam marcados como &quot;fora do prazo&quot; na agenda — o reembolso de quem pagou
          antecipado passa a ser sua decisão, em vez de automático.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="antecedenciaRemarcacaoHoras" className="text-sm font-medium">
          Prazo para o cliente remarcar sozinho (horas)
        </label>
        <Input
          id="antecedenciaRemarcacaoHoras"
          name="antecedenciaRemarcacaoHoras"
          type="number"
          min={0}
          step="0.5"
          className="max-w-40"
          defaultValue={antecedenciaRemarcacaoHorasAtual}
        />
        <p className="text-xs text-cinza-600">
          0 = sem restrição. Fora desse prazo, o cliente precisa falar com o estabelecimento — vocês
          continuam podendo remarcar pelo painel a qualquer momento.
        </p>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
