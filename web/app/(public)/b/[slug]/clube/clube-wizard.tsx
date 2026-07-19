"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { assinarPlanoPix, assinarPlanoCartao } from "./actions";
import { consultarStatusPagamento } from "../agendar/actions";
import { CardPaymentBrick } from "@/components/payment/card-payment-brick";
import { salvarTokenAgendamento } from "../meu-agendamento-link";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, BOTAO_GHOST, ROTULO_SECAO } from "../estilos";
import { ResultadoPagamento } from "../resultado-pagamento";
import { centavosToBRL } from "@/lib/money";
import { validarCPF, formatarCPF, apenasNumeros } from "@/lib/cpf";
import type { Database } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";
import { EmptyState } from "@/components/ui/empty-state";
import { Repeat } from "lucide-react";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type FormasPagamento = {
  aceita_pagamento_antecipado: boolean;
  aceita_pagamento_no_dia: boolean;
  gateway_ativo: string;
  mercado_pago_public_key: string | null;
};
export type PlanoClube = {
  id: string;
  nome: string;
  descricao: string | null;
  precoCentavos: number;
  regras: { servicoNome: string; quantidadeMes: number }[];
};
type MetodoPagamento = "pix" | "cartao";
type Passo = "plano" | "pagamento" | "dados";

const CARTAO_ESCOLHA =
  "flex flex-col gap-2 rounded-md border border-tenant-linha bg-tenant-bg p-4 text-left text-current transition-colors duration-150 hover:border-tenant-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";

export function ClubeWizard({
  estabelecimento,
  planos,
  formasPagamento,
}: {
  estabelecimento: Estabelecimento;
  planos: PlanoClube[];
  formasPagamento: FormasPagamento;
}) {
  const [passo, setPasso] = useState<Passo>("plano");
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ token: string } | null>(null);
  const [resultadoPix, setResultadoPix] = useState<{
    pagamentoId: string;
    token: string;
    qrCode: string;
    qrCodeBase64: string;
  } | null>(null);
  const [pixConfirmado, setPixConfirmado] = useState(false);
  const [aguardandoCartao, setAguardandoCartao] = useState<{ pagamentoId: string; token: string } | null>(null);
  const [cartaoConfirmado, setCartaoConfirmado] = useState(false);

  const gatewayMercadoPagoDisponivel =
    formasPagamento.aceita_pagamento_antecipado && formasPagamento.gateway_ativo === "mercado_pago";

  const planoSelecionado = planos.find((p) => p.id === planoId) ?? null;

  useEffect(() => {
    const pendente = resultadoPix ?? aguardandoCartao;
    const jaConfirmado = pixConfirmado || cartaoConfirmado;
    if (!pendente || jaConfirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await consultarStatusPagamento(pendente.pagamentoId, pendente.token);
      if (!ignorar && status?.status_assinatura === "ativa") {
        if (resultadoPix) setPixConfirmado(true);
        else setCartaoConfirmado(true);
      }
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [resultadoPix, aguardandoCartao, pixConfirmado, cartaoConfirmado]);

  function confirmar() {
    if (!planoId || metodoPagamento !== "pix") return;
    setErro(null);
    startTransition(async () => {
      const r = await assinarPlanoPix({
        estabelecimentoId: estabelecimento.id,
        planoId,
        nome,
        telefone,
        email,
      });
      if (r.error || !r.qrCode || !r.qrCodeBase64 || !r.pagamentoId || !r.token) {
        setErro(r.error ?? "Erro ao gerar cobrança Pix.");
        return;
      }
      salvarTokenAgendamento(estabelecimento.slug, r.token);
      setResultadoPix({
        pagamentoId: r.pagamentoId,
        token: r.token,
        qrCode: r.qrCode,
        qrCodeBase64: r.qrCodeBase64,
      });
    });
  }

  if (resultadoPix || aguardandoCartao) {
    const confirmado = pixConfirmado || cartaoConfirmado;
    const token = resultadoPix?.token ?? aguardandoCartao?.token ?? "";
    return (
      <ResultadoPagamento
        confirmado={confirmado}
        pix={resultadoPix && !confirmado ? { qrCode: resultadoPix.qrCode, qrCodeBase64: resultadoPix.qrCodeBase64 } : null}
        linkHref={`/b/${estabelecimento.slug}/meus-agendamentos/${token}`}
        linkLabel="Ver minha assinatura"
        tituloConfirmado="Assinatura confirmada"
        mensagemConfirmado="Seu plano já está ativo. Aproveite nos próximos agendamentos."
      />
    );
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-3">
        <Heading className="text-tenant-fg">Assinatura confirmada</Heading>
        <p className="text-tenant-fg opacity-80">Seu plano já está ativo. Aproveite nos próximos agendamentos.</p>
        <Link href={`/b/${estabelecimento.slug}/meus-agendamentos/${resultado.token}`} className={BOTAO_GHOST}>
          Ver minha assinatura
        </Link>
      </div>
    );
  }

  if (!gatewayMercadoPagoDisponivel) {
    return (
      <EmptyState
        icon={Repeat}
        titulo="Clube de assinatura indisponível"
        descricao="Esse estabelecimento ainda não configurou pagamento online para vender planos."
      />
    );
  }

  if (planos.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        titulo="Nenhum plano disponível"
        descricao="Esse estabelecimento não tem planos de assinatura ativos no momento."
      />
    );
  }

  const dadosCartaoCompletos = !!nome && !!telefone && !!email && validarCPF(cpf);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-tenant-fg">Clube de assinatura — {estabelecimento.nome}</h1>

      {passo === "plano" && (
        <div className="flex flex-col gap-2">
          <p className={ROTULO_SECAO}>Planos</p>
          {planos.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPlanoId(p.id);
                setPasso("pagamento");
              }}
              className={CARTAO_ESCOLHA}
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">{p.nome}</span>
                <span className="tabular-nums">{centavosToBRL(p.precoCentavos)}/mês</span>
              </span>
              {p.descricao && <span className="text-sm opacity-70">{p.descricao}</span>}
              {p.regras.length > 0 && (
                <ul className="text-sm opacity-70">
                  {p.regras.map((r, i) => (
                    <li key={i}>
                      {r.quantidadeMes}x {r.servicoNome} por mês
                    </li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>
      )}

      {passo === "pagamento" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">Forma de pagamento</p>
          <button
            onClick={() => {
              setMetodoPagamento("pix");
              setPasso("dados");
            }}
            className={CARTAO_ESCOLHA}
          >
            Pagar com Pix
          </button>
          <button
            onClick={() => {
              setMetodoPagamento("cartao");
              setPasso("dados");
            }}
            className={CARTAO_ESCOLHA}
          >
            Cartão de crédito
          </button>
          <button onClick={() => setPasso("plano")} className={`${BOTAO_GHOST} w-fit`}>
            Voltar
          </button>
        </div>
      )}

      {passo === "dados" && planoSelecionado && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">Seus dados</p>
          <p className="text-sm text-tenant-fg opacity-70">
            {planoSelecionado.nome}:{" "}
            <span className="font-medium tabular-nums">{centavosToBRL(planoSelecionado.precoCentavos)}/mês</span>
          </p>
          <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input
            placeholder="WhatsApp, ex: (47) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <Input
            type="email"
            placeholder="E-mail (necessário para o pagamento)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {metodoPagamento === "cartao" && (
            <Input
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              maxLength={14}
            />
          )}
          {erro && <FormError>{erro}</FormError>}

          {metodoPagamento === "cartao" ? (
            <>
              <div className="flex gap-2">
                <button onClick={() => setPasso("pagamento")} className={BOTAO_SECUNDARIO}>
                  Voltar
                </button>
              </div>
              {!dadosCartaoCompletos && (
                <p className="text-sm text-tenant-fg opacity-70">
                  {!nome || !telefone || !email
                    ? "Preencha nome, WhatsApp e e-mail para continuar."
                    : "Informe um CPF válido para continuar."}
                </p>
              )}
              {dadosCartaoCompletos && formasPagamento.mercado_pago_public_key && (
                <CardPaymentBrick
                  publicKey={formasPagamento.mercado_pago_public_key}
                  valorCentavos={planoSelecionado.precoCentavos}
                  email={email}
                  cpf={apenasNumeros(cpf)}
                  onEnviar={(formData) =>
                    assinarPlanoCartao({
                      estabelecimentoId: estabelecimento.id,
                      planoId: planoSelecionado.id,
                      nome,
                      telefone,
                      email,
                      cpf,
                      formData,
                    })
                  }
                  onResultado={(r) => {
                    if (r.error) {
                      setErro(r.error);
                      return;
                    }
                    if (r.token) salvarTokenAgendamento(estabelecimento.slug, r.token);
                    if (r.confirmado) {
                      setResultado({ token: r.token! });
                    } else if (r.pagamentoId && r.token) {
                      setAguardandoCartao({ pagamentoId: r.pagamentoId, token: r.token });
                    }
                  }}
                />
              )}
              {dadosCartaoCompletos && !formasPagamento.mercado_pago_public_key && (
                <FormError>Configuração de pagamento incompleta (public key ausente).</FormError>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setPasso("pagamento")} className={BOTAO_SECUNDARIO}>
                Voltar
              </button>
              <button disabled={pending || !nome || !telefone || !email} onClick={confirmar} className={BOTAO_PRIMARIO}>
                {pending ? "Confirmando..." : "Ir para pagamento"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
