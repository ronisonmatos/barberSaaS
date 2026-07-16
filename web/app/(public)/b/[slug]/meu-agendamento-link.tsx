"use client";

import { useSyncExternalStore } from "react";

function chaveToken(slug: string) {
  return `barbersaas:token:${slug}`;
}

export function salvarTokenAgendamento(slug: string, token: string) {
  try {
    localStorage.setItem(chaveToken(slug), token);
  } catch {
    // localStorage indisponível (ex: modo privado) — só perde a conveniência, sem quebrar o fluxo.
  }
}

function subscribe() {
  // Nada a assinar: o valor só muda via salvarTokenAgendamento, na mesma aba, entre navegações.
  return () => {};
}

function getServerSnapshot() {
  return null;
}

export function MeuAgendamentoLink({ slug }: { slug: string }) {
  const token = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(chaveToken(slug));
      } catch {
        return null;
      }
    },
    getServerSnapshot
  );

  if (!token) return null;

  return (
    <a href={`/b/${slug}/meus-agendamentos/${token}`} className="w-fit text-sm underline">
      Já tenho agendamento
    </a>
  );
}
