"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarSlotsParaRemarcar, remarcarAgendamento } from "./actions";
import { FormError } from "@/components/ui/form-error";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RemarcarButton({
  token,
  agendamentoId,
  estabelecimentoId,
  profissionalId,
  servicoId,
}: {
  token: string;
  agendamentoId: string;
  estabelecimentoId: string;
  profissionalId: string;
  servicoId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [abrindo, setAbrindo] = useState(false);
  const [data, setData] = useState(hojeISO());
  const [slots, setSlots] = useState<{ inicio: string; fim: string }[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!abrindo) return;
    let ignorar = false;
    async function carregar() {
      const resultado = await buscarSlotsParaRemarcar(estabelecimentoId, profissionalId, servicoId, data);
      if (!ignorar) setSlots(resultado);
    }
    carregar();
    return () => {
      ignorar = true;
    };
  }, [abrindo, estabelecimentoId, profissionalId, servicoId, data]);

  if (!abrindo) {
    return (
      <button onClick={() => setAbrindo(true)} className="w-fit text-sm text-tenant-fg underline opacity-80">
        Remarcar
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-tenant-linha p-3">
      <p className="text-sm font-medium text-tenant-fg">Escolha a nova data e horário</p>
      <input
        type="date"
        value={data}
        onChange={(e) => {
          setData(e.target.value);
          setSlotSelecionado(null);
        }}
        className="w-fit rounded-sm border border-tenant-linha bg-tenant-bg px-2 py-1 text-sm text-tenant-fg"
      />
      <div className="flex flex-wrap gap-2">
        {slots.map((s) => {
          const hora = new Date(s.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          return (
            <button
              key={s.inicio}
              type="button"
              onClick={() => setSlotSelecionado(s.inicio)}
              className={`rounded-sm border px-3 py-1 text-sm ${
                slotSelecionado === s.inicio
                  ? "border-tenant-acento bg-tenant-acento text-tenant-acento-fg"
                  : "border-tenant-linha text-tenant-fg"
              }`}
            >
              {hora}
            </button>
          );
        })}
        {slots.length === 0 && <p className="text-sm text-tenant-fg opacity-70">Nenhum horário livre nesse dia.</p>}
      </div>
      {erro && <FormError>{erro}</FormError>}
      <div className="flex gap-3 text-sm">
        <button
          disabled={pending || !slotSelecionado}
          onClick={() =>
            startTransition(async () => {
              if (!slotSelecionado) return;
              const r = await remarcarAgendamento(token, agendamentoId, slotSelecionado);
              if (r.error) {
                setErro(r.error);
                return;
              }
              router.refresh();
              setAbrindo(false);
            })
          }
          className="text-tenant-fg underline disabled:opacity-50"
        >
          {pending ? "Remarcando..." : "Confirmar"}
        </button>
        <button
          onClick={() => setAbrindo(false)}
          className="text-current underline opacity-70 hover:opacity-100"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
