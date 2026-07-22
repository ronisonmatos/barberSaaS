"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { salvarRitual } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Passo = { titulo: string; texto: string };

const MAX_PASSOS = 4;

export function RitualForm({ passosAtuais }: { passosAtuais: Passo[] }) {
  const [state, action, pending] = useActionState(salvarRitual, undefined);
  const [passos, setPassos] = useState<Passo[]>(passosAtuais.length > 0 ? passosAtuais : []);

  function adicionar() {
    setPassos((prev) => [...prev, { titulo: "", texto: "" }]);
  }

  function remover(indice: number) {
    setPassos((prev) => prev.filter((_, i) => i !== indice));
  }

  function atualizar(indice: number, campo: keyof Passo, valor: string) {
    setPassos((prev) => prev.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)));
  }

  return (
    <form
      action={(formData) => {
        formData.set("passos", JSON.stringify(passos));
        action(formData);
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-xs text-cinza-600">
        Descreva em passos numerados a experiência do atendimento (ex: Recepção, Diagnóstico,
        Execução, Finalização). Some da home se ficar vazio.
      </p>
      {passos.map((passo, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border border-linha bg-marfim-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cinza-600">Passo {i + 1}</span>
            <button
              type="button"
              onClick={() => remover(i)}
              aria-label="Remover passo"
              className="text-cinza-600 hover:text-erro"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <Input
            value={passo.titulo}
            onChange={(e) => atualizar(i, "titulo", e.target.value)}
            placeholder="Título (ex: Recepção)"
            maxLength={40}
          />
          <Input
            value={passo.texto}
            onChange={(e) => atualizar(i, "texto", e.target.value)}
            placeholder="Descrição curta (ex: Café ou chá enquanto você escolhe o estilo)"
            maxLength={160}
          />
        </div>
      ))}

      {passos.length < MAX_PASSOS && (
        <Button type="button" variant="secondary" className="w-fit text-sm" onClick={adicionar}>
          + Adicionar passo
        </Button>
      )}

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar ritual"}
      </Button>
    </form>
  );
}
