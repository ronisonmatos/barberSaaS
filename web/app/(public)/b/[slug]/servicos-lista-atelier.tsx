"use client";

import { centavosToBRL } from "@/lib/money";
import { AtelierReveal } from "./atelier-reveal";
import { ServicosFiltro } from "./servicos-filtro";
import type { Database } from "@/lib/supabase/types";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

// Mesmo motivo do wrapper do clássico: home-atelier.tsx é Server Component.
export function ServicosListaAtelier({ servicos }: { servicos: Servico[] }) {
  return (
    <ServicosFiltro
      servicos={servicos}
      renderLista={(lista) => (
        <AtelierReveal stagger className="flex flex-col">
          {lista.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-baseline gap-3 py-5 transition-[padding] duration-300 hover:pl-2 ${
                i === 0 ? "border-y border-tenant-linha" : "border-b border-tenant-linha"
              }`}
            >
              <span className="shrink-0 font-display text-xl">{s.nome}</span>
              <span className="shrink-0 text-xs text-tenant-fg/60">{s.duracao_minutos} min</span>
              <span className="mb-1 h-px flex-1 border-b border-dotted border-tenant-linha" />
              <span className="shrink-0 font-display text-lg tabular-nums text-tenant-acento">
                {centavosToBRL(s.preco_centavos)}
              </span>
            </div>
          ))}
        </AtelierReveal>
      )}
    />
  );
}
