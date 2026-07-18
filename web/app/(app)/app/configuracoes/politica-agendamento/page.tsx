import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { PoliticaAgendamentoForm } from "../politica-agendamento-form";
import { VoltarConfiguracoes } from "../voltar-link";

export default async function PoliticaAgendamentoConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Política de agendamento</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const config = (estabelecimento.config ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Política de agendamento</Heading>
      <Card className="p-4">
        <PoliticaAgendamentoForm
          antecedenciaMinHorasAtual={Number(config.antecedencia_min_horas ?? 2)}
          antecedenciaCancelamentoHorasAtual={Number(config.antecedencia_cancelamento_horas ?? 0)}
          antecedenciaRemarcacaoHorasAtual={Number(config.antecedencia_remarcacao_horas ?? 0)}
        />
      </Card>
    </div>
  );
}
