"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type Servico = Database["public"]["Tables"]["servicos"]["Row"];

const SEM_CATEGORIA = "Outros";

function rotuloCategoria(categoria: string | null) {
  const limpa = categoria?.trim();
  return limpa || SEM_CATEGORIA;
}

// Compartilhado entre home-classico/home-prestigio/home-atelier e o passo de escolha de serviço
// do agendar-wizard (e qualquer template futuro) — cada um passa seu próprio `renderLista` pra
// manter o visual do card de serviço específico do template; só a busca/agrupamento é comum.
//
// Categorias viram um acordeão vertical (nome + contagem, uma por linha) em vez de chips lado a
// lado: com estabelecimentos reais chegando a 7+ categorias e nomes longos ("Tinturas e
// pigmentações", "ASSINATURA (RENOVAÇÃO MENSAL)"), chips quebram em várias linhas e ficam
// difíceis de escanear. Buscar por nome ignora a categoria e mostra a lista plana com os
// resultados, já que nesse momento o usuário sabe o que quer e não precisa navegar por seção.
export function ServicosFiltro({
  servicos,
  renderLista,
}: {
  servicos: Servico[];
  renderLista: (servicos: Servico[]) => ReactNode;
}) {
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState<Set<string>>(new Set());

  const categorias = useMemo(() => {
    const vistas = new Map<string, string>();
    for (const s of servicos) {
      const rotulo = rotuloCategoria(s.categoria);
      const chave = rotulo.toLowerCase();
      if (!vistas.has(chave)) vistas.set(chave, rotulo);
    }
    return [...vistas.values()].sort((a, b) => {
      if (a === SEM_CATEGORIA) return b === SEM_CATEGORIA ? 0 : 1;
      if (b === SEM_CATEGORIA) return -1;
      return a.localeCompare(b, "pt-BR");
    });
  }, [servicos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return servicos;
    return servicos.filter((s) => s.nome.toLowerCase().includes(termo));
  }, [servicos, busca]);

  const grupos = useMemo(() => {
    if (categorias.length <= 1) return null;
    const porCategoria = new Map<string, Servico[]>();
    for (const s of filtrados) {
      const chave = rotuloCategoria(s.categoria).toLowerCase();
      if (!porCategoria.has(chave)) porCategoria.set(chave, []);
      porCategoria.get(chave)!.push(s);
    }
    return categorias
      .map((nome) => ({ nome, itens: porCategoria.get(nome.toLowerCase()) ?? [] }))
      .filter((g) => g.itens.length > 0);
  }, [filtrados, categorias]);

  function alternarCategoria(nome: string) {
    setAbertas((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(nome)) proxima.delete(nome);
      else proxima.add(nome);
      return proxima;
    });
  }

  const mostrarBusca = servicos.length > 6 || categorias.length > 1;

  return (
    <div className="flex flex-col gap-4">
      {mostrarBusca && (
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar serviço..."
          aria-label="Buscar serviço por nome"
          className="w-full rounded-xl border border-tenant-linha bg-tenant-bg px-4 py-2.5 text-sm text-current outline-none placeholder:opacity-50 focus:border-tenant-acento"
        />
      )}

      {filtrados.length === 0 ? (
        <p className="text-sm opacity-60">Nenhum serviço encontrado.</p>
      ) : busca.trim() || !grupos ? (
        renderLista(filtrados)
      ) : (
        <div className="flex flex-col divide-y divide-tenant-linha border-y border-tenant-linha">
          {grupos.map((g) => {
            const aberta = abertas.has(g.nome);
            return (
              <div key={g.nome}>
                <button
                  type="button"
                  onClick={() => alternarCategoria(g.nome)}
                  aria-expanded={aberta}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold"
                >
                  <span>
                    {g.nome} <span className="font-normal opacity-60">({g.itens.length})</span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 opacity-60 transition-transform duration-200 ${aberta ? "rotate-180" : ""}`}
                  />
                </button>
                {aberta && <div className="pb-4">{renderLista(g.itens)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
