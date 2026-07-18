"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { centavosToBRL } from "@/lib/money";
import { PlanoCheckout } from "./plano-checkout";
import type { Database } from "@/lib/supabase/types";

type Plano = Database["public"]["Tables"]["planos_plataforma"]["Row"];

const SUPORTE_LABEL: Record<string, string> = {
  limitado: "Suporte limitado",
  prioritario: "Suporte prioritário",
};

const FLAG_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  relatorios: "Relatórios",
  pagamento_online: "Pagamento online no agendamento",
};

function listarRecursos(plano: Plano): string[] {
  const itens: string[] = [
    plano.max_profissionais ? `Até ${plano.max_profissionais} profissionais` : "Profissionais ilimitados",
    plano.max_usuarios ? `Até ${plano.max_usuarios} usuários no painel` : "Usuários ilimitados",
    plano.max_fotos ? `Até ${plano.max_fotos} fotos na página pública` : "Fotos ilimitadas",
  ];
  const recursos = (plano.recursos ?? {}) as Record<string, boolean | string>;
  const { suporte, loja, ...flags } = recursos;
  if (loja === true) {
    itens.push(plano.max_produtos ? `Loja com até ${plano.max_produtos} produtos` : "Loja com produtos ilimitados");
  }
  if (typeof suporte === "string" && SUPORTE_LABEL[suporte]) {
    itens.push(SUPORTE_LABEL[suporte]);
  }
  for (const [chave, ativo] of Object.entries(flags)) {
    if (ativo === true) itens.push(FLAG_LABEL[chave] ?? chave);
  }
  return itens;
}

export function PlanoCard({
  plano,
  ativo,
  podeAssinar,
  publicKey,
  email,
}: {
  plano: Plano;
  ativo: boolean;
  podeAssinar: boolean;
  publicKey: string | null;
  email: string;
}) {
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  return (
    <Card className={`flex flex-col gap-3 p-4 ${ativo ? "border-latao" : ""}`}>
      <div>
        <p className="font-display text-xl text-carvao">{plano.nome}</p>
        <p className="text-carvao">
          <span className="text-2xl">{centavosToBRL(plano.preco_centavos)}</span>
          <span className="text-sm text-cinza-600">/mês</span>
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-1 text-sm text-cinza-600">
        {listarRecursos(plano).map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
      {ativo && <p className="text-xs font-medium text-sucesso">Plano atual</p>}
      {podeAssinar && !checkoutAberto && (
        <Button variant={ativo ? "secondary" : "primary"} onClick={() => setCheckoutAberto(true)}>
          {ativo ? "Renovar" : "Assinar este plano"}
        </Button>
      )}
      {checkoutAberto && (
        <PlanoCheckout
          planoId={plano.id}
          planoNome={plano.nome}
          valorCentavos={plano.preco_centavos}
          publicKey={publicKey}
          email={email}
          onFechar={() => setCheckoutAberto(false)}
        />
      )}
    </Card>
  );
}
