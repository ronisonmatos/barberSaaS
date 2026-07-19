"use client";

import { useState, useTransition } from "react";
import { resgatarCartaoFidelidade } from "./actions";
import { SelosProgresso } from "@/components/ui/selos-progresso";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export type CartaoDetalhado = {
  id: string;
  selosAtual: number;
  status: "em_andamento" | "completo" | "resgatado";
  completadoEm: string | null;
  resgatadoEm: string | null;
  clienteNome: string;
  clienteTelefone: string;
  programaNome: string;
  selosNecessarios: number;
  brinde: string;
};

const FILTROS = [
  { valor: "em_andamento", label: "Em andamento" },
  { valor: "completo", label: "Prontos para resgatar" },
  { valor: "resgatado", label: "Resgatados" },
] as const;

export function FidelidadeClient({ cartoes }: { cartoes: CartaoDetalhado[] }) {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["valor"]>("completo");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [resgatando, setResgatando] = useState<string | null>(null);

  const filtrados = cartoes.filter((c) => c.status === filtro);

  function resgatar(cartaoId: string) {
    setErro(null);
    setResgatando(cartaoId);
    startTransition(async () => {
      const r = await resgatarCartaoFidelidade(cartaoId);
      if (r.error) setErro(r.error);
      setResgatando(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 text-sm">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`rounded-full px-3 py-1 ${
              filtro === f.valor ? "bg-latao text-carvao" : "border border-linha text-carvao hover:bg-marfim"
            }`}
          >
            {f.label} ({cartoes.filter((c) => c.status === f.valor).length})
          </button>
        ))}
      </div>

      {erro && <FormError>{erro}</FormError>}

      {filtrados.length === 0 ? (
        <p className="text-sm text-cinza-600">Nenhum cartão nesse filtro.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((c) => (
            <div key={c.id} className="rounded-md border border-linha bg-marfim-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-carvao">{c.clienteNome}</p>
                  <p className="text-xs text-cinza-600">{c.clienteTelefone}</p>
                </div>
                {c.status === "completo" && (
                  <Button
                    disabled={pending}
                    onClick={() => resgatar(c.id)}
                    className="text-sm"
                  >
                    {resgatando === c.id ? "Resgatando..." : "Resgatar"}
                  </Button>
                )}
                {c.status === "resgatado" && (
                  <span className="text-xs text-sucesso">Resgatado</span>
                )}
              </div>
              <p className="mt-2 text-sm text-carvao">{c.programaNome}</p>
              <p className="text-xs text-cinza-600">Brinde: {c.brinde}</p>
              <div className="mt-2">
                <SelosProgresso atual={c.selosAtual} total={c.selosNecessarios} />
                <p className="mt-1 text-xs text-cinza-600">
                  {c.selosAtual} de {c.selosNecessarios} selos
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
