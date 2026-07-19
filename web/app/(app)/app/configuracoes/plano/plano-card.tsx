"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaixaPromocional } from "@/components/ui/faixa-promocional";
import { centavosToBRL } from "@/lib/money";
import { listarRecursos, precoVigente } from "@/lib/planos";
import { plural } from "@/lib/plural";
import { PlanoCheckout } from "./plano-checkout";
import type { Database } from "@/lib/supabase/types";

type Plano = Database["public"]["Tables"]["planos_plataforma"]["Row"];
type AssinaturaAtual = {
  plano_plataforma_id: string;
  preco_promocional_centavos: number | null;
  preco_promocional_ate: string | null;
} | null;

export function PlanoCard({
  plano,
  ativo,
  assinaturaAtual,
  podeAssinar,
  publicKey,
  email,
}: {
  plano: Plano;
  ativo: boolean;
  assinaturaAtual: AssinaturaAtual;
  podeAssinar: boolean;
  publicKey: string | null;
  email: string;
}) {
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const valorVigente = precoVigente(plano, assinaturaAtual);
  const emPromocao = valorVigente !== plano.preco_centavos;

  return (
    <Card className={`relative flex flex-col gap-3 p-4 ${ativo ? "border-latao" : ""}`}>
      {emPromocao && <FaixaPromocional texto={plano.promocao_titulo || "Promoção"} />}
      <div>
        <p className="font-display text-xl text-carvao">{plano.nome}</p>
        <p className="text-carvao">
          {emPromocao && (
            <span className="mr-2 text-sm text-cinza-600 line-through">
              {centavosToBRL(plano.preco_centavos)}
            </span>
          )}
          <span className="text-2xl">{centavosToBRL(valorVigente)}</span>
          <span className="text-sm text-cinza-600">/mês</span>
        </p>
        {emPromocao && plano.promocao_duracao_meses && (
          <p className="text-xs text-latao-escuro">
            Por {plano.promocao_duracao_meses} {plural(plano.promocao_duracao_meses, "mês", "meses")}, depois{" "}
            {centavosToBRL(plano.preco_centavos)}/mês
          </p>
        )}
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
          valorCentavos={valorVigente}
          publicKey={publicKey}
          email={email}
          onFechar={() => setCheckoutAberto(false)}
        />
      )}
    </Card>
  );
}
