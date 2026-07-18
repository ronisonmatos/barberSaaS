"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarSlotsDisponiveis, remarcarAgendamento } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RemarcarDialog({
  agendamentoId,
  profissionalId,
  servicoId,
  onClose,
}: {
  agendamentoId: string;
  profissionalId: string;
  servicoId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState(hojeISO());
  const [slots, setSlots] = useState<{ inicio: string; fim: string }[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let ignorar = false;
    async function carregar() {
      const resultado = await buscarSlotsDisponiveis(profissionalId, servicoId, data);
      if (!ignorar) setSlots(resultado);
    }
    carregar();
    return () => {
      ignorar = true;
    };
  }, [profissionalId, servicoId, data]);

  function confirmar() {
    if (!slotSelecionado) {
      setErro("Escolha um horário.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await remarcarAgendamento(agendamentoId, slotSelecionado);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carvao/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-md bg-marfim-2 p-6">
        <Heading as="h2">Remarcar agendamento</Heading>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nova data</label>
          <Input
            type="date"
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              setSlotSelecionado(null);
            }}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-carvao">Horário disponível em {data}</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const hora = new Date(s.inicio).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <button
                  key={s.inicio}
                  type="button"
                  onClick={() => setSlotSelecionado(s.inicio)}
                  className={`rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                    slotSelecionado === s.inicio
                      ? "border-latao bg-latao text-carvao"
                      : "border-linha text-carvao hover:border-latao"
                  }`}
                >
                  {hora}
                </button>
              );
            })}
            {slots.length === 0 && (
              <p className="text-sm text-cinza-600">Nenhum horário livre nesse dia.</p>
            )}
          </div>
        </div>

        {erro && <FormError>{erro}</FormError>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="text-sm">
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={confirmar} className="text-sm">
            {pending ? "Remarcando..." : "Confirmar remarcação"}
          </Button>
        </div>
      </div>
    </div>
  );
}
