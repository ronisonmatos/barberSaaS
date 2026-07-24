"use client";

import { centavosToBRL } from "@/lib/money";
import { ServicosFiltro } from "./servicos-filtro";
import type { Database } from "@/lib/supabase/types";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

// Mesmo motivo do wrapper do clássico: home-prestigio.tsx é Server Component.
export function ServicosListaPrestigio({ servicos }: { servicos: Servico[] }) {
  return (
    <ServicosFiltro
      servicos={servicos}
      renderLista={(lista) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((s) => (
            <div key={s.id} className="flex flex-col gap-2 rounded-2xl border border-tenant-linha bg-tenant-bg-2 p-5">
              <p className="text-lg font-semibold">{s.nome}</p>
              <p className="text-sm opacity-60">{s.duracao_minutos} min</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-tenant-acento">
                {centavosToBRL(s.preco_centavos)}
              </p>
            </div>
          ))}
        </div>
      )}
    />
  );
}
