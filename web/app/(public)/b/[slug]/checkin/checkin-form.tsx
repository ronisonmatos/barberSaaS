"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { buscarAgendamentosCheckin, confirmarChegada, type AgendamentoCheckin } from "./actions";
import { BOTAO_PRIMARIO, BOTAO_GHOST } from "../estilos";

type Passo = "botao" | "telefone" | "lista" | "sucesso";

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function CheckinForm({
  estabelecimentoId,
  botaoAbrirClassName,
}: {
  estabelecimentoId: string;
  botaoAbrirClassName: string;
}) {
  const [passo, setPasso] = useState<Passo>("botao");
  const [telefone, setTelefone] = useState("");
  const [agendamentos, setAgendamentos] = useState<AgendamentoCheckin[]>([]);
  const [confirmado, setConfirmado] = useState<AgendamentoCheckin | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (passo === "botao") {
    return (
      <button onClick={() => setPasso("telefone")} className={botaoAbrirClassName}>
        Já tenho agendamento
      </button>
    );
  }

  if (passo === "telefone") {
    return (
      <div className="flex flex-col gap-3">
        <Input
          placeholder="WhatsApp, ex: (47) 99999-9999"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        {erro && <FormError>{erro}</FormError>}
        <button
          disabled={pending || telefone.trim().length === 0}
          className={BOTAO_PRIMARIO}
          onClick={() => {
            setErro(null);
            startTransition(async () => {
              const r = await buscarAgendamentosCheckin({ estabelecimentoId, telefone });
              if (r.error) {
                setErro(r.error);
                return;
              }
              if (!r.agendamentos || r.agendamentos.length === 0) {
                setErro("Nenhum agendamento encontrado para hoje com esse WhatsApp.");
                return;
              }
              setAgendamentos(r.agendamentos);
              setPasso("lista");
            });
          }}
        >
          {pending ? "Buscando..." : "Buscar meu agendamento"}
        </button>
        <button onClick={() => setPasso("botao")} className={`${BOTAO_GHOST} w-fit`}>
          Voltar
        </button>
      </div>
    );
  }

  if (passo === "lista") {
    return (
      <div className="flex flex-col gap-3">
        {erro && <FormError>{erro}</FormError>}
        {agendamentos.map((a) => (
          <div
            key={a.agendamentoId}
            className="flex flex-col gap-1 rounded-xl border border-tenant-linha bg-tenant-bg p-4"
          >
            <p className="font-medium text-tenant-fg">{formatarHora(a.inicio)}</p>
            <p className="text-tenant-fg opacity-80">
              {a.servicoNome} com {a.profissionalNome}
            </p>
            {a.jaChegou ? (
              <p className="text-sm text-tenant-acento">Chegada já confirmada</p>
            ) : (
              <button
                disabled={pending}
                className={`${BOTAO_PRIMARIO} mt-1 w-fit`}
                onClick={() => {
                  setErro(null);
                  startTransition(async () => {
                    const r = await confirmarChegada({
                      estabelecimentoId,
                      agendamentoId: a.agendamentoId,
                      telefone,
                    });
                    if (r.error) {
                      setErro(r.error);
                      return;
                    }
                    setConfirmado(a);
                    setPasso("sucesso");
                  });
                }}
              >
                {pending ? "Confirmando..." : "Confirmar chegada"}
              </button>
            )}
          </div>
        ))}
        <button onClick={() => setPasso("botao")} className={`${BOTAO_GHOST} w-fit`}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-tenant-linha bg-tenant-bg p-4 text-center">
      <p className="font-medium text-tenant-fg">Chegada confirmada!</p>
      {confirmado && (
        <p className="text-tenant-fg opacity-80">
          {formatarHora(confirmado.inicio)} — {confirmado.servicoNome} com {confirmado.profissionalNome}
        </p>
      )}
      <p className="text-sm text-tenant-fg opacity-70">Aguarde ser chamado.</p>
    </div>
  );
}
