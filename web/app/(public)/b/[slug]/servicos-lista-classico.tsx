"use client";

import { centavosToBRL } from "@/lib/money";
import { ServicosFiltro } from "./servicos-filtro";
import type { Database } from "@/lib/supabase/types";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

// home-classico.tsx é Server Component: não pode passar `renderLista` (função) direto pro
// ServicosFiltro (Client Component) — precisa desse wrapper client no meio, que recebe só os
// dados já serializáveis (`servicos`) do server.
export function ServicosListaClassico({ servicos }: { servicos: Servico[] }) {
  return (
    <ServicosFiltro
      servicos={servicos}
      renderLista={(lista) => (
        <ul className="flex flex-col gap-2">
          {lista.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-tenant-linha bg-tenant-bg p-4"
            >
              <div>
                <p className="text-[15px] font-semibold">{s.nome}</p>
                <p className="mt-0.5 text-[13px] opacity-60">{s.duracao_minutos}min</p>
              </div>
              <p className="text-base font-bold tabular-nums">{centavosToBRL(s.preco_centavos)}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
