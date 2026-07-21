"use client";

import { useState } from "react";
import { CadastroVipForm } from "./cadastro-vip-form";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";

type Plano = {
  id: string;
  nome: string;
  precoCentavos: number;
  servicosCobertos: { servicoId: string; servicoNome: string }[];
};

export function CadastroVipSection({
  planos,
  podeConfigurarHorarioFixo,
  profissionaisPorServico,
}: {
  planos: Plano[];
  podeConfigurarHorarioFixo: boolean;
  profissionaisPorServico: Record<string, { id: string; nome: string }[]>;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t border-linha pt-4">
      <div className="flex items-center justify-between">
        <Heading as="h2">Cadastrar cliente VIP</Heading>
        {!aberto && (
          <Button variant="secondary" onClick={() => setAberto(true)}>
            Novo cliente VIP
          </Button>
        )}
      </div>
      {aberto ? (
        <CadastroVipForm
          planos={planos}
          podeConfigurarHorarioFixo={podeConfigurarHorarioFixo}
          profissionaisPorServico={profissionaisPorServico}
          onDone={() => setAberto(false)}
        />
      ) : (
        <p className="text-sm text-cinza-600">
          Cadastre um cliente que já é seu de longa data direto pelo painel, com ou sem horário
          fixo, sem precisar que ele assine pela página pública.
        </p>
      )}
    </div>
  );
}
