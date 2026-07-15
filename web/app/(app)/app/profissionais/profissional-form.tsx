"use client";

import { useActionState, useState } from "react";
import { salvarProfissional } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];

type Jornada = { dia_semana: number; hora_inicio: string; hora_fim: string };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function ProfissionalForm({
  profissional,
  servicos,
  jornadasIniciais,
  servicoIdsIniciais,
  onDone,
}: {
  profissional?: Profissional | null;
  servicos: Servico[];
  jornadasIniciais: Jornada[];
  servicoIdsIniciais: string[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarProfissional, undefined);
  const [jornadas, setJornadas] = useState<Jornada[]>(jornadasIniciais);
  const [servicoIds, setServicoIds] = useState<string[]>(servicoIdsIniciais);
  const [novoIntervalo, setNovoIntervalo] = useState<Record<number, { inicio: string; fim: string }>>(
    {}
  );

  return (
    <form
      action={async (formData) => {
        formData.set("jornadas", JSON.stringify(jornadas));
        formData.set("servico_ids", JSON.stringify(servicoIds));
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      {profissional && <input type="hidden" name="id" value={profissional.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Nome</label>
          <input
            name="nome"
            required
            defaultValue={profissional?.nome}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Comissão (%)</label>
          <input
            name="comissao_percentual"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={profissional?.comissao_percentual ?? 0}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="ativo" defaultChecked={profissional?.ativo ?? true} />
            Ativo
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Serviços que realiza</p>
        <div className="flex flex-wrap gap-3">
          {servicos.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={servicoIds.includes(s.id)}
                onChange={(e) =>
                  setServicoIds((prev) =>
                    e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                  )
                }
              />
              {s.nome}
            </label>
          ))}
          {servicos.length === 0 && (
            <p className="text-sm text-neutral-500">Cadastre serviços primeiro.</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Jornada semanal</p>
        <div className="flex flex-col gap-2">
          {DIAS.map((nomeDia, dia) => (
            <div key={dia} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-20 shrink-0">{nomeDia}</span>
              {jornadas
                .map((j, idx) => ({ ...j, idx }))
                .filter((j) => j.dia_semana === dia)
                .map((j) => (
                  <span
                    key={j.idx}
                    className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-800"
                  >
                    {j.hora_inicio}–{j.hora_fim}
                    <button
                      type="button"
                      onClick={() => setJornadas((prev) => prev.filter((_, i) => i !== j.idx))}
                      className="text-red-600"
                      aria-label="remover intervalo"
                    >
                      ×
                    </button>
                  </span>
                ))}
              <input
                type="time"
                value={novoIntervalo[dia]?.inicio ?? ""}
                onChange={(e) =>
                  setNovoIntervalo((prev) => ({
                    ...prev,
                    [dia]: { inicio: e.target.value, fim: prev[dia]?.fim ?? "" },
                  }))
                }
                className="w-24 rounded-md border border-neutral-300 px-1 py-1 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <span>–</span>
              <input
                type="time"
                value={novoIntervalo[dia]?.fim ?? ""}
                onChange={(e) =>
                  setNovoIntervalo((prev) => ({
                    ...prev,
                    [dia]: { inicio: prev[dia]?.inicio ?? "", fim: e.target.value },
                  }))
                }
                className="w-24 rounded-md border border-neutral-300 px-1 py-1 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                type="button"
                onClick={() => {
                  const intervalo = novoIntervalo[dia];
                  if (!intervalo?.inicio || !intervalo?.fim) return;
                  setJornadas((prev) => [
                    ...prev,
                    { dia_semana: dia, hora_inicio: intervalo.inicio, hora_fim: intervalo.fim },
                  ]);
                  setNovoIntervalo((prev) => ({ ...prev, [dia]: { inicio: "", fim: "" } }));
                }}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
              >
                + adicionar
              </button>
            </div>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        {profissional && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
