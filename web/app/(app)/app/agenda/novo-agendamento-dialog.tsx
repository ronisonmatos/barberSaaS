"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarSlotsDisponiveis, criarAgendamentoManual } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export function NovoAgendamentoDialog({
  data,
  profissionais,
  servicos,
  clientes,
  profissionalInicial,
  onClose,
}: {
  data: string;
  profissionais: Profissional[];
  servicos: Servico[];
  clientes: Cliente[];
  profissionalInicial?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [profissionalId, setProfissionalId] = useState(profissionalInicial ?? profissionais[0]?.id ?? "");
  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? "");
  const [slots, setSlots] = useState<{ inicio: string; fim: string }[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [modoCliente, setModoCliente] = useState<"existente" | "novo">("existente");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let ignorar = false;
    async function carregar() {
      const resultado =
        profissionalId && servicoId && data
          ? await buscarSlotsDisponiveis(profissionalId, servicoId, data)
          : [];
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
      const resultado = await criarAgendamentoManual({
        profissionalId,
        servicoId,
        inicio: slotSelecionado,
        clienteId: modoCliente === "existente" ? clienteId : undefined,
        clienteNome: modoCliente === "novo" ? clienteNome : undefined,
        clienteTelefone: modoCliente === "novo" ? clienteTelefone : undefined,
      });
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg bg-white p-6 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Novo agendamento</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => {
                setProfissionalId(e.target.value);
                setSlotSelecionado(null);
              }}
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Serviço</label>
            <select
              value={servicoId}
              onChange={(e) => {
                setServicoId(e.target.value);
                setSlotSelecionado(null);
              }}
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Horário disponível em {data}</p>
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
                  className={`rounded-md border px-3 py-1 text-sm ${
                    slotSelecionado === s.inicio
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-300 dark:border-neutral-700"
                  }`}
                >
                  {hora}
                </button>
              );
            })}
            {slots.length === 0 && (
              <p className="text-sm text-neutral-500">Nenhum horário livre nesse dia.</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setModoCliente("existente")}
              className={modoCliente === "existente" ? "font-semibold underline" : "text-neutral-500"}
            >
              Cliente existente
            </button>
            <button
              type="button"
              onClick={() => setModoCliente("novo")}
              className={modoCliente === "novo" ? "font-semibold underline" : "text-neutral-500"}
            >
              Novo cliente
            </button>
          </div>
          {modoCliente === "existente" ? (
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.telefone}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                placeholder="Nome"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <input
                placeholder="(47) 99999-9999"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          )}
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirmar}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {pending ? "Agendando..." : "Confirmar agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
