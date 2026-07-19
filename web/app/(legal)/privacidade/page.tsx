import type { Metadata } from "next";
import { Heading } from "@/components/ui/heading";
import { Revisar } from "../revisar";

export const metadata: Metadata = {
  title: "Política de Privacidade — Comptus",
  description:
    "Como a Comptus e os estabelecimentos que usam a plataforma tratam dados pessoais, em conformidade com a LGPD.",
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-linha pt-6">
      <h2 className="font-display text-xl text-carvao">{titulo}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-carvao">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Heading>Política de Privacidade</Heading>
        <p className="text-sm text-cinza-600">
          Última atualização: <Revisar>data de publicação</Revisar>.
        </p>
      </div>

      <Secao titulo="1. Dois papéis diferentes, pela LGPD">
        <p>
          A Lei Geral de Proteção de Dados (LGPD) distingue quem <strong>decide</strong> como os
          dados são usados (controlador) de quem apenas <strong>processa</strong> dados em nome
          de outra parte (operador). Na Comptus:
        </p>
        <p>
          Somos <strong>controladores</strong> dos dados da sua conta no painel: nome, e-mail,
          gênero (opcional, usado só para tratamento de texto na interface), CPF (quando
          fornecido, no momento de contratar um plano pago) e dados de uso da plataforma.
        </p>
        <p>
          Somos <strong>operadores</strong> dos dados dos clientes finais que agendam horários
          com um Estabelecimento (nome, telefone, e-mail, histórico de agendamentos e compras):
          esses dados pertencem ao Estabelecimento, que é o controlador perante seus próprios
          clientes. Nós apenas armazenamos e processamos essas informações em nome dele, seguindo
          suas instruções.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados coletamos">
        <ul className="list-disc pl-5">
          <li>Dados de cadastro do dono/equipe: nome, e-mail, senha (criptografada), gênero (opcional) e CPF (opcional, só quando exigido pelo Mercado Pago para pagamento com cartão).</li>
          <li>Dados do estabelecimento: nome, endereço, telefone, logo, fotos, CNPJ (opcional).</li>
          <li>Dados de clientes finais: nome, telefone, e-mail (quando fornecido), histórico de agendamentos e pedidos.</li>
          <li>Dados de pagamento: processados diretamente pelo Mercado Pago — não armazenamos número de cartão de crédito.</li>
          <li>Dados técnicos: endereço IP e informações de uso, para segurança e funcionamento da plataforma.</li>
        </ul>
      </Secao>

      <Secao titulo="3. Para que usamos os dados">
        <p>
          Para viabilizar o agendamento e pagamento, autenticar contas, prevenir fraude,
          enviar comunicações operacionais (confirmação de agendamento, links de gerenciamento) e
          cumprir obrigações legais.
        </p>
        <p>Não vendemos dados pessoais a terceiros.</p>
      </Secao>

      <Secao titulo="4. Com quem compartilhamos">
        <p>
          <strong>Mercado Pago</strong> — processamento de pagamentos (Pix e cartão de crédito).{" "}
          <strong>Supabase</strong> — hospedagem do banco de dados e autenticação.{" "}
          <strong>Cloudflare</strong> — hospedagem da aplicação web. Cada um desses parceiros
          processa dados sob seus próprios termos de segurança e privacidade.
        </p>
      </Secao>

      <Secao titulo="5. Seus direitos">
        <p>
          Conforme a LGPD, você pode solicitar acesso, correção, exclusão, portabilidade ou
          anonimização dos seus dados pessoais. Donos e equipe podem editar a maior parte dos
          próprios dados diretamente em &quot;Minha conta&quot;. Clientes finais de um
          Estabelecimento devem direcionar esse pedido diretamente ao Estabelecimento
          (controlador dos seus dados), ou a nós, que encaminharemos ao Estabelecimento
          responsável.
        </p>
      </Secao>

      <Secao titulo="6. Retenção e exclusão">
        <p>
          Mantemos os dados enquanto a conta estiver ativa e pelo prazo adicional necessário para
          cumprir obrigações legais (ex: fiscais). Ao encerrar uma conta, os dados podem ser
          anonimizados ou excluídos, ressalvado o que a lei exigir manter.
        </p>
      </Secao>

      <Secao titulo="7. Segurança">
        <p>
          Usamos controle de acesso por permissão (RLS) no banco de dados, conexões criptografadas
          (HTTPS) e senhas armazenadas com hash — nunca em texto puro. Nenhum sistema é
          100% livre de risco, mas trabalhamos para manter boas práticas de segurança.
        </p>
      </Secao>

      <Secao titulo="8. Cookies">
        <p>
          Usamos cookies essenciais para manter sua sessão autenticada. Não usamos cookies de
          rastreamento publicitário.
        </p>
      </Secao>

      <Secao titulo="9. Encarregado de dados (DPO)">
        <p>
          Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato com{" "}
          <Revisar>e-mail do encarregado (DPO) ou contato de privacidade</Revisar>.
        </p>
      </Secao>

      <Secao titulo="10. Alterações nesta política">
        <p>
          Podemos atualizar esta Política periodicamente. Mudanças relevantes serão comunicadas
          pelo painel ou por e-mail.
        </p>
      </Secao>
    </>
  );
}
