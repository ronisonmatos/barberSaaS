import type { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Revisar } from "../revisar";

export const metadata: Metadata = {
  title: "Termos de Uso — Comptus",
  description: "Termos de uso da plataforma Comptus, sistema de agendamento para barbearias e salões de beleza.",
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-linha pt-6">
      <h2 className="font-display text-xl text-carvao">{titulo}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-carvao">{children}</div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Heading>Termos de Uso</Heading>
        <p className="text-sm text-cinza-600">
          Última atualização: <Revisar>data de publicação</Revisar>.
        </p>
      </div>

      <Secao titulo="1. O que é a Comptus">
        <p>
          A Comptus é uma plataforma (SaaS) de agendamento online para barbearias, salões de
          beleza e negócios similares (&quot;Estabelecimentos&quot;). Ela permite que cada
          Estabelecimento tenha sua própria página pública para receber agendamentos, gerenciar
          profissionais, serviços, clientes, produtos e pagamentos.
        </p>
        <p>
          Estes Termos regem o uso da plataforma tanto por quem administra um Estabelecimento
          (donos e equipe) quanto pelos clientes finais que agendam horários através dela.
        </p>
      </Secao>

      <Secao titulo="2. Cadastro e conta">
        <p>
          Para usar o painel administrativo, é necessário criar uma conta com nome, e-mail e
          senha. Você é responsável por manter a confidencialidade da sua senha e por todas as
          atividades realizadas na sua conta.
        </p>
        <p>
          Informações fornecidas no cadastro devem ser verdadeiras e mantidas atualizadas. A
          Comptus pode suspender ou encerrar contas que violem estes Termos ou a lei aplicável.
        </p>
      </Secao>

      <Secao titulo="3. Planos e pagamentos">
        <p>
          A Comptus oferece um plano gratuito com recursos limitados e planos pagos com recursos
          adicionais, cobrados por assinatura mensal. Os preços e recursos de cada plano são
          exibidos no painel e podem ser alterados mediante aviso prévio razoável.
        </p>
        <p>
          Pagamentos de assinatura da plataforma, bem como pagamentos de clientes finais aos
          Estabelecimentos (Pix e cartão de crédito), são processados por meio do Mercado Pago.
          A Comptus não armazena dados completos de cartão de crédito — a tokenização acontece
          diretamente no navegador do pagador.
        </p>
        <p>
          Reembolsos de agendamentos cancelados ficam a critério de cada Estabelecimento,
          conforme sua própria política de cancelamento configurada no painel.
        </p>
      </Secao>

      <Secao titulo="4. Responsabilidades do Estabelecimento">
        <p>
          Cada Estabelecimento é responsável pelo conteúdo que publica em sua página pública
          (nome, fotos, descrição, serviços, preços), pelo atendimento prestado a seus clientes e
          pelo cumprimento de suas próprias obrigações legais, fiscais e trabalhistas.
        </p>
        <p>
          A Comptus não é parte na relação entre o Estabelecimento e seus clientes finais — atua
          apenas como fornecedora da ferramenta de agendamento e processamento de pagamento.
        </p>
      </Secao>

      <Secao titulo="5. Uso adequado">
        <p>
          É proibido usar a Comptus para atividades ilegais, para enviar spam, para tentar
          acessar dados de outros Estabelecimentos, ou para qualquer uso que comprometa a
          segurança ou o funcionamento da plataforma.
        </p>
      </Secao>

      <Secao titulo="6. Propriedade intelectual">
        <p>
          A marca Comptus, seu design e seu código são de propriedade da Comptus. O conteúdo que
          cada Estabelecimento publica (logo, fotos, textos) permanece de propriedade do próprio
          Estabelecimento.
        </p>
      </Secao>

      <Secao titulo="7. Limitação de responsabilidade">
        <p>
          A Comptus se esforça para manter a plataforma disponível e funcionando corretamente,
          mas não garante disponibilidade ininterrupta. Na extensão máxima permitida por lei, a
          Comptus não se responsabiliza por perdas indiretas decorrentes do uso ou
          indisponibilidade da plataforma.
        </p>
      </Secao>

      <Secao titulo="8. Alterações nestes Termos">
        <p>
          Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas
          pelo painel ou por e-mail. O uso continuado da plataforma após uma alteração constitui
          aceitação dos novos Termos.
        </p>
      </Secao>

      <Secao titulo="9. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
          foro da comarca de <Revisar>cidade/UF</Revisar>, com exclusão de qualquer outro.
        </p>
        <p className="text-xs text-cinza-600">
          Razão social e CNPJ da empresa responsável pela Comptus: <Revisar>preencher</Revisar>.
        </p>
      </Secao>

      <Secao titulo="10. Contato">
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para{" "}
          <Revisar>e-mail de contato oficial</Revisar>.
        </p>
      </Secao>
    </>
  );
}
