"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelarAgendamento } from "./actions";

export function CancelarButton({ token, agendamentoId }: { token: string; agendamentoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button onClick={() => setConfirmando(true)} className="text-sm text-red-600 underline">
        Cancelar agendamento
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm">Tem certeza que deseja cancelar?</p>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="flex gap-2 text-sm">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await cancelarAgendamento(token, agendamentoId);
              if (r.error) {
                setErro(r.error);
                return;
              }
              router.refresh();
              setConfirmando(false);
            })
          }
          className="text-red-600 underline"
        >
          {pending ? "Cancelando..." : "Sim, cancelar"}
        </button>
        <button onClick={() => setConfirmando(false)} className="text-neutral-500 underline">
          Voltar
        </button>
      </div>
    </div>
  );
}
