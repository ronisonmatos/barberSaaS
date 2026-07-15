"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { buscarSlotsPublico, criarAgendamentoPublico } from "./actions";
import { centavosToBRL } from "@/lib/money";
import { hojeNaTimezone } from "@/lib/timezone";
import type { Database } from "@/lib/supabase/types";

type Barbearia = Database["public"]["Tables"]["barbearias"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];

const QUALQUER = "qualquer";

export function AgendarWizard({
  barbearia,
  servicos,
  profissionais,
  vinculos,
}: {
  barbearia: Barbearia;
  servicos: Servico[];
  profissionais: Profissional[];
  vinculos: { profissional_id: string; servico_id: string }[];
}) {
  const [passo, setPasso] = useState(1);
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [profissionalEscolha, setProfissionalEscolha] = useState<string | null>(null);
  const [data, setData] = useState(hojeNaTimezone(barbearia.timezone));
  const [slots, setSlots] = useState<{ inicio: string; fim: string }[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ token: string } | null>(null);

  const profissionaisQualificados = useMemo(
    () =>
      profissionais.filter((p) =>
        vinculos.some((v) => v.profissional_id === p.id && v.servico_id === servicoId)
      ),
    [profissionais, vinculos, servicoId]
  );

  const profissionalId =
    profissionalEscolha === QUALQUER ? profissionaisQualificados[0]?.id ?? null : profissionalEscolha;

  useEffect(() => {
    let ignorar = false;
    async function carregar() {
      const resultado =
        profissionalId && servicoId && data
          ? await buscarSlotsPublico(barbearia.id, profissionalId, servicoId, data)
          : [];
      if (!ignorar) setSlots(resultado);
    }
    carregar();
    return () => {
      ignorar = true;
    };
  }, [barbearia.id, profissionalId, servicoId, data]);

  function confirmar() {
    if (!profissionalId || !servicoId || !slotSelecionado) return;
    setErro(null);
    startTransition(async () => {
      const r = await criarAgendamentoPublico({
        barbeariaId: barbearia.id,
        profissionalId,
        servicoId,
        inicio: slotSelecionado,
        nome,
        telefone,
      });
      if (r.error) {
        setErro(r.error);
        return;
      }
      setResultado({ token: r.token! });
    });
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Agendamento confirmado!</h1>
        <p>Você vai receber a confirmação pelo WhatsApp informado.</p>
        <Link
          href={`/b/${barbearia.slug}/meus-agendamentos/${resultado.token}`}
          className="underline"
        >
          Ver ou cancelar meu agendamento
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Agendar em {barbearia.nome}</h1>

      {passo === 1 && (
        <div className="flex flex-col gap-2">
          <p className="font-medium">1. Escolha o serviço</p>
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoId(s.id);
                setProfissionalEscolha(null);
                setSlotSelecionado(null);
                setPasso(2);
              }}
              className="flex justify-between rounded-md border border-neutral-300 p-3 text-left dark:border-neutral-700"
            >
              <span>{s.nome}</span>
              <span>{centavosToBRL(s.preco_centavos)}</span>
            </button>
          ))}
        </div>
      )}

      {passo === 2 && (
        <div className="flex flex-col gap-2">
          <p className="font-medium">2. Escolha o profissional</p>
          {profissionaisQualificados.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProfissionalEscolha(p.id);
                setSlotSelecionado(null);
                setPasso(3);
              }}
              className="rounded-md border border-neutral-300 p-3 text-left dark:border-neutral-700"
            >
              {p.nome}
            </button>
          ))}
          <button
            onClick={() => {
              setProfissionalEscolha(QUALQUER);
              setSlotSelecionado(null);
              setPasso(3);
            }}
            className="rounded-md border border-neutral-300 p-3 text-left dark:border-neutral-700"
          >
            Qualquer profissional disponível
          </button>
          <button onClick={() => setPasso(1)} className="w-fit text-sm text-neutral-500 underline">
            Voltar
          </button>
        </div>
      )}

      {passo === 3 && (
        <div className="flex flex-col gap-3">
          <p className="font-medium">3. Escolha data e horário</p>
          <input
            type="date"
            value={data}
            min={hojeNaTimezone(barbearia.timezone)}
            onChange={(e) => {
              setData(e.target.value);
              setSlotSelecionado(null);
            }}
            className="w-fit rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const hora = new Date(s.inicio).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <button
                  key={s.inicio}
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
            {slots.length === 0 && <p className="text-sm text-neutral-500">Sem horários livres nesse dia.</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPasso(2)} className="text-sm text-neutral-500 underline">
              Voltar
            </button>
            <button
              disabled={!slotSelecionado}
              onClick={() => setPasso(4)}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {passo === 4 && (
        <div className="flex flex-col gap-3">
          <p className="font-medium">4. Seus dados</p>
          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
          <input
            placeholder="WhatsApp, ex: (47) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button onClick={() => setPasso(3)} className="text-sm text-neutral-500 underline">
              Voltar
            </button>
            <button
              disabled={pending || !nome || !telefone}
              onClick={confirmar}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {pending ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
