"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelarAgendamento } from "./actions";
import { FormError } from "@/components/ui/form-error";

export function CancelarButton({ token, agendamentoId }: { token: string; agendamentoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button onClick={() => setConfirmando(true)} className="w-fit text-sm text-erro underline">
        Cancelar agendamento
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-tenant-fg">Tem certeza que deseja cancelar?</p>
      {erro && <FormError>{erro}</FormError>}
      <div className="flex gap-3 text-sm">
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
          className="text-erro underline disabled:opacity-50"
        >
          {pending ? "Cancelando..." : "Sim, cancelar"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-current underline opacity-70 hover:opacity-100"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
