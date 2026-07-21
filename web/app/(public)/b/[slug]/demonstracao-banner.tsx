"use client";

import { useState, useTransition } from "react";
import { solicitarAtivacaoRascunho } from "./actions-demonstracao";
import { BOTAO_PRIMARIO } from "./estilos";

function diasRestantes(expiraEm: string | null): string {
  if (!expiraEm) return "breve";
  const dias = Math.max(0, Math.ceil((new Date(expiraEm).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  if (dias === 0) return "hoje";
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

export function DemonstracaoBanner({
  estabelecimentoId,
  nome,
  expiraEm,
}: {
  estabelecimentoId: string;
  nome: string;
  expiraEm: string | null;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [nomeContato, setNomeContato] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const r = await solicitarAtivacaoRascunho({ estabelecimentoId, nome: nomeContato, email });
      if (r.error) setErro(r.error);
      else setEnviado(true);
    });
  }

  return (
    <div className="border-b border-tenant-acento bg-tenant-acento/10 px-4 py-3 text-center text-sm text-tenant-fg">
      {enviado ? (
        <p className="font-medium">
          Prontinho! Em breve alguém vai entrar em contato pra ativar sua conta.
        </p>
      ) : (
        <div className="mx-auto flex max-w-[480px] flex-col items-center gap-2">
          <p className="w-full sm:truncate">
            Demonstração feita para <span className="font-medium">{nome}</span>
          </p>
          <p className="w-full text-xs opacity-80 sm:truncate">
            Expira em {diasRestantes(expiraEm)} se não for ativada.
          </p>
          {mostrarForm ? (
            <form onSubmit={enviar} className="flex w-full flex-col items-center gap-2">
              <div className="flex w-full flex-col gap-2">
                <input
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="h-11 w-full min-w-0 rounded-md border-2 border-tenant-fg/25 bg-tenant-bg-2 px-3 text-sm text-tenant-fg placeholder:opacity-60 focus:border-tenant-acento focus:outline-none focus:ring-2 focus:ring-tenant-acento"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Seu e-mail"
                  required
                  className="h-11 w-full min-w-0 rounded-md border-2 border-tenant-fg/25 bg-tenant-bg-2 px-3 text-sm text-tenant-fg placeholder:opacity-60 focus:border-tenant-acento focus:outline-none focus:ring-2 focus:ring-tenant-acento"
                />
              </div>
              {erro && <p className="text-xs text-erro">{erro}</p>}
              <button type="submit" disabled={pending} className={BOTAO_PRIMARIO}>
                {pending ? "Enviando..." : "Enviar"}
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setMostrarForm(true)} className={BOTAO_PRIMARIO}>
              Quero ativar minha conta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
