import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

export const metadata: Metadata = {
  title: "Como configurar o WhatsApp — Comptus",
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-linha pt-6">
      <h2 className="font-display text-lg text-carvao">{titulo}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-carvao">{children}</div>
    </section>
  );
}

function Erro({ mensagem, causa }: { mensagem: string; causa: string }) {
  return (
    <div className="rounded-md border border-linha bg-marfim p-3">
      <p className="font-mono text-xs text-cinza-600">{mensagem}</p>
      <p className="mt-1 text-sm text-carvao">{causa}</p>
    </div>
  );
}

export default function AjudaWhatsappPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/app/configuracoes/whatsapp"
        className="inline-flex w-fit items-center gap-1 text-sm text-cinza-600 transition-colors duration-150 hover:text-carvao"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Voltar
      </Link>
      <Heading>Como configurar o WhatsApp</Heading>

      <Card className="flex flex-col gap-6 p-6">
        <p className="text-sm leading-relaxed text-carvao">
          O WhatsApp Business Platform (Meta) tem mais etapas do que parece à primeira vista.
          Este guia reúne o que descobrimos configurando de verdade, pra você não precisar
          descobrir do zero.
        </p>

        <Secao titulo="1. Dois jeitos de configurar — não confunda os dois">
          <p>
            A Meta oferece dois caminhos bem diferentes, pensados pra momentos diferentes:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-linha bg-marfim p-3">
              <p className="font-medium text-carvao">Número de teste</p>
              <p className="mt-1 text-xs text-cinza-600">
                Um número que a própria Meta empresta, grátis e pronto assim que você abre{" "}
                <strong>WhatsApp → Configuração da API</strong> no seu app em Meta for
                Developers. Serve só pra confirmar que as credenciais funcionam antes de ir pra
                produção.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-cinza-600">
                <li>Só envia para números que você mesmo cadastrar e verificar na lista de destinatários de teste.</li>
                <li>Só tem um template pronto (<code>hello_world</code>, em inglês, sem poder customizar).</li>
              </ul>
            </div>
            <div className="rounded-md border border-linha bg-marfim p-3">
              <p className="font-medium text-carvao">Número de produção</p>
              <p className="mt-1 text-xs text-cinza-600">
                O número real que vai enviar avisos pros seus clientes de verdade. Envia para
                qualquer número, sem lista de permissão.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-cinza-600">
                <li>Precisa ser um número <strong>exclusivo</strong> pra API (ver seção 3).</li>
                <li>Precisa do seu próprio template, criado e aprovado pela Meta — não pode usar o <code>hello_world</code>.</li>
              </ul>
            </div>
          </div>
          <p>
            Recomendação: configure primeiro no número de teste pra validar que tudo funciona, e
            só troque pro número de produção quando o template já estiver aprovado.
          </p>
        </Secao>

        <Secao titulo="2. Criar e aprovar o template de mensagem">
          <p>
            Isso é obrigatório pro número de produção (o de teste usa o <code>hello_world</code>
            {" "}pronto). Crie em <strong>WhatsApp Manager → Modelos de mensagem</strong> (ou dentro
            do app em Meta for Developers → WhatsApp → Modelos de mensagem).
          </p>
          <p>
            O texto do aviso de renovação usa três variáveis, nesta ordem: nome do
            estabelecimento, nome do plano, data de vencimento. Copie o <strong>nome exato</strong>
            {" "}do template salvo (ex: <code>lembrete_renovacao</code>) no campo de configuração.
          </p>
          <p>
            A aprovação da Meta <strong>não é instantânea</strong> — pode levar de minutos a
            algumas horas. Enquanto estiver como <code>PENDING</code>, nenhum envio real funciona.
            Acompanhe o status em WhatsApp Manager → Modelos de mensagem.
          </p>
        </Secao>

        <Secao titulo="3. Número exclusivo pra API">
          <p>
            O número de telefone usado na API <strong>não pode estar ativo</strong> ao mesmo tempo
            no aplicativo comum do WhatsApp (pessoal ou Business App). Se for o mesmo número que
            vocês já usam hoje pra conversar com clientes pelo app normal, será preciso migrá-lo
            pra API oficial (processo específico da Meta, que desconecta o app comum) — o mais
            simples costuma ser usar um número novo, dedicado só a isso.
          </p>
        </Secao>

        <Secao titulo="4. Permissões do token de acesso">
          <p>
            Ao gerar o token (em um Usuário do Sistema nas Configurações do Negócio, ou o token
            temporário em Configuração da API), garanta que as duas permissões estejam marcadas:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><code>whatsapp_business_management</code> — leitura/gestão da conta.</li>
            <li><code>whatsapp_business_messaging</code> — envio de mensagens.</li>
          </ul>
          <p>
            Sem a segunda, o token consegue ler dados da conta normalmente, mas o envio falha
            (ver &quot;Authorization Error&quot; na seção abaixo).
          </p>
        </Secao>

        <Secao titulo="5. Erros comuns">
          <Erro
            mensagem="(#131030) Recipient phone number not in allowed list"
            causa="Você está usando o número de teste e o destinatário ainda não foi adicionado (e verificado com o código) na lista de destinatários de teste."
          />
          <Erro
            mensagem='"Authorization Error" (code 100)'
            causa="O token não tem a permissão whatsapp_business_messaging — regenere com as duas permissões da seção 4."
          />
          <Erro
            mensagem="(#131058) Hello World templates can only be sent from the Public Test Numbers"
            causa="Você está tentando enviar o hello_world a partir do número de produção. Use seu próprio template aprovado."
          />
          <Erro
            mensagem='Template com status "PENDING"'
            causa="A Meta ainda não aprovou o template — aguarde e confira de novo em WhatsApp Manager → Modelos de mensagem."
          />
        </Secao>
      </Card>
    </div>
  );
}
