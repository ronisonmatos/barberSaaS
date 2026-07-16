"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarSlotsDisponiveis, criarAgendamentoManual } from "./actions";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carvao/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-md bg-marfim-2 p-6">
        <Heading as="h2">Novo agendamento</Heading>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => {
                setProfissionalId(e.target.value);
                setSlotSelecionado(null);
              }}
              className="h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
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
              className="h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
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

        <div>
          <div className="mb-2 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setModoCliente("existente")}
              className={modoCliente === "existente" ? "font-semibold text-carvao underline" : "text-cinza-600"}
            >
              Cliente existente
            </button>
            <button
              type="button"
              onClick={() => setModoCliente("novo")}
              className={modoCliente === "novo" ? "font-semibold text-carvao underline" : "text-cinza-600"}
            >
              Novo cliente
            </button>
          </div>
          {modoCliente === "existente" ? (
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="h-11 w-full rounded-sm border border-linha bg-marfim-2 px-3 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.telefone}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Nome"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="(47) 99999-9999"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="flex-1"
              />
            </div>
          )}
        </div>

        {erro && <FormError>{erro}</FormError>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="text-sm">
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={confirmar} className="text-sm">
            {pending ? "Agendando..." : "Confirmar agendamento"}
          </Button>
        </div>
      </div>
    </div>
  );
}
