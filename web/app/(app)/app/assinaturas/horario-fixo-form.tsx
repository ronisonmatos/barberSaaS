"use client";

import { useState, useTransition } from "react";
import { salvarHorarioFixo } from "./actions-horario-fixo";
import { HorarioFixoCampos, type Servico, type Profissional, type HorarioFixo } from "./horario-fixo-campos";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function HorarioFixoForm({
  assinaturaClienteId,
  servicosCobertos,
  profissionaisPorServico,
  horarioFixo,
  onDone,
}: {
  assinaturaClienteId: string;
  servicosCobertos: Servico[];
  profissionaisPorServico: Record<string, Profissional[]>;
  horarioFixo: HorarioFixo | null;
  onDone: () => void;
}) {
  const [servicoId, setServicoId] = useState(horarioFixo?.servicoId ?? servicosCobertos[0]?.servicoId ?? "");
  const [tipoRecorrencia, setTipoRecorrencia] = useState<"intervalo" | "mensal">(
    horarioFixo?.tipoRecorrencia ?? "intervalo"
  );
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const profissionaisDisponiveis = profissionaisPorServico[servicoId] ?? [];

  function salvar(formData: FormData) {
    setErro(null);
    formData.set("assinaturaClienteId", assinaturaClienteId);
    formData.set("horarioFixoId", horarioFixo?.id ?? "");
    formData.set("tipoRecorrencia", tipoRecorrencia);
    startTransition(async () => {
      const r = await salvarHorarioFixo(formData);
      if (r.error) setErro(r.error);
      else onDone();
    });
  }

  return (
    <form action={salvar} className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
      <HorarioFixoCampos
        servicoId={servicoId}
        setServicoId={setServicoId}
        tipoRecorrencia={tipoRecorrencia}
        setTipoRecorrencia={setTipoRecorrencia}
        servicosCobertos={servicosCobertos}
        profissionaisDisponiveis={profissionaisDisponiveis}
        horarioFixo={horarioFixo}
      />

      {erro && <FormError>{erro}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || profissionaisDisponiveis.length === 0}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
