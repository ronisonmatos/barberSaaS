"use client";

import { useActionState, useRef, useState } from "react";
import { salvarProfissionalRascunho, enviarFotoProfissionalRascunho } from "./actions";
import { TAMANHO_MAX_LOGO_BYTES } from "@/app/(app)/app/configuracoes/limites";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Jornada = { dia_semana: number; hora_inicio: string; hora_fim: string };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const HORARIO_PADRAO = { hora_inicio: "09:00", hora_fim: "18:00" };

function formatarMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

export function ProfissionalFormRascunho({
  estabelecimentoId,
  profissional,
  jornadasIniciais,
  servicos,
  servicoIdsIniciais,
  onDone,
}: {
  estabelecimentoId: string;
  profissional?: Profissional | null;
  jornadasIniciais: Jornada[];
  servicos: Servico[];
  servicoIdsIniciais: string[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarProfissionalRascunho, undefined);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(profissional?.foto_url ?? null);
  const [jornadas, setJornadas] = useState<Jornada[]>(jornadasIniciais);
  const [servicoIds, setServicoIds] = useState<string[]>(servicoIdsIniciais);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  async function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !profissional) return;
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      setErroFoto(`Imagem muito grande (máx. ${formatarMB(TAMANHO_MAX_LOGO_BYTES)}). Escolha outra.`);
      e.target.value = "";
      return;
    }
    setErroFoto(null);
    setEnviandoFoto(true);
    const fd = new FormData();
    fd.set("foto", arquivo);
    const r = await enviarFotoProfissionalRascunho(estabelecimentoId, profissional.id, fd);
    setEnviandoFoto(false);
    if (r.error) {
      setErroFoto(r.error);
    } else if (r.fotoUrl) {
      setFotoUrl(r.fotoUrl);
    }
  }

  function alternarDia(dia: number, aberto: boolean) {
    if (aberto) {
      setJornadas((prev) => [...prev, { dia_semana: dia, ...HORARIO_PADRAO }]);
    } else {
      setJornadas((prev) => prev.filter((j) => j.dia_semana !== dia));
    }
  }

  function atualizarIntervalo(idx: number, campo: "hora_inicio" | "hora_fim", valor: string) {
    setJornadas((prev) => prev.map((j, i) => (i === idx ? { ...j, [campo]: valor } : j)));
  }

  function adicionarIntervalo(dia: number) {
    setJornadas((prev) => [...prev, { dia_semana: dia, ...HORARIO_PADRAO }]);
  }

  function removerIntervalo(idx: number) {
    setJornadas((prev) => prev.filter((_, i) => i !== idx));
  }

  function copiarSegundaParaDiasUteis() {
    const intervalosSegunda = jornadas.filter((j) => j.dia_semana === 1);
    if (intervalosSegunda.length === 0) return;
    setJornadas((prev) => [
      ...prev.filter((j) => j.dia_semana < 2 || j.dia_semana > 5),
      ...[2, 3, 4, 5].flatMap((dia) => intervalosSegunda.map((j) => ({ ...j, dia_semana: dia }))),
    ]);
  }

  function aplicarHorarioPadrao() {
    setJornadas([1, 2, 3, 4, 5, 6].map((dia) => ({ dia_semana: dia, ...HORARIO_PADRAO })));
  }

  return (
    <form
      action={async (formData) => {
        formData.set("jornadas", JSON.stringify(jornadas));
        formData.set("servico_ids", JSON.stringify(servicoIds));
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-4 rounded-md border border-linha bg-marfim-2 p-4"
    >
      <input type="hidden" name="estabelecimentoId" value={estabelecimentoId} />
      {profissional && <input type="hidden" name="id" value={profissional.id} />}

      {profissional && (
        <div className="flex items-center gap-4">
          <label
            htmlFor="input-foto-profissional"
            className={`group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-linha ${enviandoFoto ? "pointer-events-none opacity-50" : ""}`}
          >
            {fotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
              <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center text-[10px] text-cinza-600">Sem foto</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-carvao/60 text-[11px] font-medium text-marfim opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {enviandoFoto ? "Enviando..." : "Alterar"}
            </span>
          </label>
          <input
            ref={inputFotoRef}
            id="input-foto-profissional"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={selecionarFoto}
            disabled={enviandoFoto}
            className="sr-only"
          />
          <p className="text-xs text-cinza-300">PNG, JPEG, WEBP ou SVG — até {formatarMB(TAMANHO_MAX_LOGO_BYTES)}.</p>
        </div>
      )}
      {erroFoto && <FormError>{erroFoto}</FormError>}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nome</label>
        <Input name="nome" required defaultValue={profissional?.nome} />
        {!profissional && (
          <p className="text-xs text-cinza-300">Salve primeiro pra depois poder adicionar uma foto.</p>
        )}
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
                  setServicoIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                }
              />
              {s.nome}
            </label>
          ))}
          {servicos.length === 0 && <p className="text-sm text-cinza-600">Cadastre serviços primeiro.</p>}
        </div>
        <p className="mt-1 text-xs text-cinza-300">
          Sem isso, o profissional não aparece com horários disponíveis pra agendar.
        </p>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Jornada semanal</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={aplicarHorarioPadrao}
              className="text-xs text-latao-escuro underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2"
            >
              Aplicar horário padrão (seg-sáb, 09h-18h)
            </button>
            <button
              type="button"
              onClick={copiarSegundaParaDiasUteis}
              className="text-xs text-latao-escuro underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2"
            >
              Copiar segunda para terça–sexta
            </button>
          </div>
        </div>
        <div className="flex flex-col divide-y divide-linha rounded-md border border-linha">
          {DIAS.map((nomeDia, dia) => {
            const intervalosDoDia = jornadas.map((j, idx) => ({ ...j, idx })).filter((j) => j.dia_semana === dia);
            const aberto = intervalosDoDia.length > 0;
            return (
              <div key={dia} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                <label className="flex w-32 shrink-0 items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={aberto} onChange={(e) => alternarDia(dia, e.target.checked)} />
                  {nomeDia}
                </label>
                {aberto ? (
                  <div className="flex flex-1 flex-col gap-2">
                    {intervalosDoDia.map((j) => (
                      <div key={j.idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={j.hora_inicio}
                          onChange={(e) => atualizarIntervalo(j.idx, "hora_inicio", e.target.value)}
                          className="rounded-sm border border-linha bg-marfim-2 px-2 py-1 text-sm text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
                        />
                        <span className="text-sm text-cinza-600">às</span>
                        <input
                          type="time"
                          value={j.hora_fim}
                          onChange={(e) => atualizarIntervalo(j.idx, "hora_fim", e.target.value)}
                          className="rounded-sm border border-linha bg-marfim-2 px-2 py-1 text-sm text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
                        />
                        {j.hora_fim <= j.hora_inicio && <span className="text-xs text-erro">fim antes do início</span>}
                        {intervalosDoDia.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerIntervalo(j.idx)}
                            className="text-cinza-300 hover:text-erro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2"
                            aria-label="remover intervalo"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => adicionarIntervalo(dia)}
                      className="w-fit text-xs text-latao-escuro underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2"
                    >
                      + intervalo
                    </button>
                  </div>
                ) : (
                  <p className="pt-1 text-sm text-cinza-300">Fechado</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {profissional && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
