"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { marcarNotificacaoLida } from "./notificacoes-actions";
import type { Database } from "@/lib/supabase/types";

type Notificacao = Database["public"]["Tables"]["notificacoes"]["Row"];

function tempoRelativo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function NotificacoesBell({
  estabelecimentoId,
  notificacoesIniciais,
  alinhamento = "direita",
}: {
  estabelecimentoId: string;
  notificacoesIniciais: Notificacao[];
  /** "esquerda" abre pra direita (usar quando o botão fica perto da borda esquerda, ex. sidebar
   * estreita — "direita" estouraria a tela); "direita" abre pra esquerda (padrão, usar quando o
   * botão fica perto da borda direita, ex. topbar). */
  alinhamento?: "esquerda" | "direita";
}) {
  const [notificacoes, setNotificacoes] = useState(notificacoesIniciais);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // createClient() retorna um cliente singleton (padrão do @supabase/ssr) — em dev, o Strict
    // Mode do React monta este efeito duas vezes, e o segundo .channel() com o mesmo nome
    // reaproveitaria um canal que o primeiro já inscreveu, o que faz .on() explodir ("cannot add
    // postgres_changes callbacks... after subscribe()"). Remove qualquer canal do mesmo tópico
    // antes de criar o novo.
    const topico = `realtime:notificacoes-${estabelecimentoId}`;
    supabase.getChannels().filter((c) => c.topic === topico).forEach((c) => supabase.removeChannel(c));

    const canal = supabase
      .channel(`notificacoes-${estabelecimentoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `estabelecimento_id=eq.${estabelecimentoId}`,
        },
        (payload) => {
          setNotificacoes((prev) => [payload.new as Notificacao, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [estabelecimentoId]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  function marcarLida(id: string) {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    marcarNotificacaoLida(id);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        aria-expanded={aberto}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-cinza-600 hover:bg-marfim hover:text-carvao"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-erro px-1 text-[10px] font-medium text-marfim-2">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div
            className={`absolute z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-md border border-linha bg-marfim-2 p-2 shadow-lg ${
              alinhamento === "esquerda" ? "left-0" : "right-0"
            }`}
          >
            {notificacoes.length === 0 ? (
              <p className="p-3 text-sm text-cinza-600">Nenhuma notificação ainda.</p>
            ) : (
              notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => marcarLida(n.id)}
                  className={`flex w-full flex-col gap-0.5 rounded-md p-2 text-left text-sm hover:bg-marfim ${
                    n.lida ? "text-cinza-600" : "text-carvao"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{n.titulo}</span>
                    <span className="shrink-0 text-xs text-cinza-600">{tempoRelativo(n.created_at)}</span>
                  </span>
                  {n.descricao && <span className="text-xs">{n.descricao}</span>}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
