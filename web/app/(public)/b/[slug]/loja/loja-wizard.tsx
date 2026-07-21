"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { criarPedidoPublico, criarPedidoPix, criarPedidoCartao, criarPedidoCartaoAsaas } from "./actions";
import { consultarStatusPagamento } from "../agendar/actions";
import { CardPaymentBrick } from "@/components/payment/card-payment-brick";
import { salvarTokenAgendamento } from "../meu-agendamento-link";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, BOTAO_GHOST, ROTULO_SECAO } from "../estilos";
import { ResultadoPagamento } from "../resultado-pagamento";
import { CarrinhoProdutos, type ProdutoCarrinho } from "../carrinho-produtos";
import { centavosToBRL } from "@/lib/money";
import { validarCPF, formatarCPF, apenasNumeros } from "@/lib/cpf";
import type { Database } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag } from "lucide-react";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type FormasPagamento = {
  aceita_pagamento_antecipado: boolean;
  aceita_pagamento_no_dia: boolean;
  gateway_ativo: string;
  mercado_pago_public_key: string | null;
};
type MetodoPagamento = "no_local" | "pix" | "cartao";
type Passo = "carrinho" | "pagamento" | "dados";

const CARTAO_ESCOLHA =
  "flex justify-between rounded-md border border-tenant-linha bg-tenant-bg p-3 text-left text-current transition-colors duration-150 hover:border-tenant-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";

export function LojaWizard({
  estabelecimento,
  produtos,
  formasPagamento,
  produtoInicial,
  initialAguardandoCartao,
}: {
  estabelecimento: Estabelecimento;
  produtos: ProdutoCarrinho[];
  formasPagamento: FormasPagamento;
  produtoInicial?: string | null;
  initialAguardandoCartao?: { pagamentoId: string; token: string } | null;
}) {
  const [passo, setPasso] = useState<Passo>("carrinho");
  const [carrinho, setCarrinho] = useState<Record<string, number>>(() => {
    const produto = produtoInicial ? produtos.find((p) => p.id === produtoInicial) : null;
    return produto && produto.estoque > 0 ? { [produto.id]: 1 } : {};
  });
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
  const [aguardandoCartao, setAguardandoCartao] = useState<{ pagamentoId: string; token: string } | null>(
    initialAguardandoCartao ?? null
  );
  const [cartaoConfirmado, setCartaoConfirmado] = useState(false);

  const gatewayAceitaPix =
    formasPagamento.aceita_pagamento_antecipado &&
    (formasPagamento.gateway_ativo === "mercado_pago" || formasPagamento.gateway_ativo === "asaas");
  const gatewayAceitaCartao = formasPagamento.aceita_pagamento_antecipado;
  const opcoesPagamento: MetodoPagamento[] = [
    ...(gatewayAceitaPix ? (["pix"] as const) : []),
    ...(gatewayAceitaCartao ? (["cartao"] as const) : []),
    ...(formasPagamento.aceita_pagamento_no_dia ? (["no_local"] as const) : []),
  ];
  const podeEscolherFormaPagamento = opcoesPagamento.length > 1;

  const itensCarrinho = Object.entries(carrinho)
    .filter(([, qtd]) => qtd > 0)
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
  const totalCentavos = itensCarrinho.reduce((soma, item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);
    return soma + (produto ? produto.preco_centavos * item.quantidade : 0);
  }, 0);

  useEffect(() => {
    const pendente = resultadoPix ?? aguardandoCartao;
    const jaConfirmado = pixConfirmado || cartaoConfirmado;
    if (!pendente || jaConfirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await consultarStatusPagamento(pendente.pagamentoId, pendente.token);
      if (!ignorar && status?.status_pedido === "aguardando_retirada") {
        if (resultadoPix) setPixConfirmado(true);
        else setCartaoConfirmado(true);
      }
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [resultadoPix, aguardandoCartao, pixConfirmado, cartaoConfirmado]);

  function irParaFormaPagamentoOuDados() {
    if (podeEscolherFormaPagamento) {
      setPasso("pagamento");
    } else {
      setMetodoPagamento(opcoesPagamento[0] ?? "no_local");
      setPasso("dados");
    }
  }

  function confirmar() {
    if (itensCarrinho.length === 0 || !metodoPagamento) return;
    setErro(null);

    if (metodoPagamento === "no_local") {
      startTransition(async () => {
        const r = await criarPedidoPublico({
          estabelecimentoId: estabelecimento.id,
          itens: itensCarrinho,
          nome,
          telefone,
        });
        if (r.error) {
          setErro(r.error);
          return;
        }
        salvarTokenAgendamento(estabelecimento.slug, r.token!);
        setResultado({ token: r.token! });
      });
      return;
    }

    if (metodoPagamento === "pix") {
      startTransition(async () => {
        const r = await criarPedidoPix({
          estabelecimentoId: estabelecimento.id,
          itens: itensCarrinho,
          nome,
          telefone,
          email,
          cpf: pixExigeCpf ? cpf : undefined,
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
  }

  if (resultadoPix || aguardandoCartao) {
    const confirmado = pixConfirmado || cartaoConfirmado;
    const token = resultadoPix?.token ?? aguardandoCartao?.token ?? "";
    return (
      <ResultadoPagamento
        confirmado={confirmado}
        pix={resultadoPix && !confirmado ? { qrCode: resultadoPix.qrCode, qrCodeBase64: resultadoPix.qrCodeBase64 } : null}
        linkHref={`/b/${estabelecimento.slug}/meus-agendamentos/${token}`}
        linkLabel="Ver meu pedido"
        tituloConfirmado="Pagamento confirmado"
        mensagemConfirmado="Seu pedido está pronto para retirada no estabelecimento."
      />
    );
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-3">
        <Heading className="text-tenant-fg">Pedido confirmado</Heading>
        <p className="text-tenant-fg opacity-80">
          Combine com o estabelecimento a retirada dos produtos no local.
        </p>
        <Link href={`/b/${estabelecimento.slug}/meus-agendamentos/${resultado.token}`} className={BOTAO_GHOST}>
          Ver meu pedido
        </Link>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        titulo="Loja indisponível"
        descricao="Esse estabelecimento não tem produtos à venda no momento."
      />
    );
  }

  const cartaoViaAsaas = metodoPagamento === "cartao" && formasPagamento.gateway_ativo === "asaas";
  const dadosCartaoCompletos =
    metodoPagamento === "cartao" && !!nome && !!telefone && !!email && (cartaoViaAsaas || validarCPF(cpf));
  const pixExigeCpf = metodoPagamento === "pix" && formasPagamento.gateway_ativo === "asaas";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-tenant-fg">Loja de {estabelecimento.nome}</h1>

      {passo === "carrinho" && (
        <div className="flex flex-col gap-3">
          <p className={ROTULO_SECAO}>Produtos</p>
          <CarrinhoProdutos
            produtos={produtos}
            carrinho={carrinho}
            onChange={(produtoId, quantidade) =>
              setCarrinho((prev) => ({ ...prev, [produtoId]: quantidade }))
            }
          />
          <div className="flex items-center justify-between border-t border-tenant-linha pt-3">
            <p className="text-sm opacity-70">Total</p>
            <p className="font-medium tabular-nums">{centavosToBRL(totalCentavos)}</p>
          </div>
          <button
            disabled={itensCarrinho.length === 0}
            onClick={irParaFormaPagamentoOuDados}
            className={BOTAO_PRIMARIO}
          >
            Finalizar pedido
          </button>
        </div>
      )}

      {passo === "pagamento" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">Forma de pagamento</p>
          {gatewayAceitaPix && (
            <button
              onClick={() => {
                setMetodoPagamento("pix");
                setPasso("dados");
              }}
              className={CARTAO_ESCOLHA}
            >
              Pagar agora (Pix)
            </button>
          )}
          {gatewayAceitaCartao && (
            <button
              onClick={() => {
                setMetodoPagamento("cartao");
                setPasso("dados");
              }}
              className={CARTAO_ESCOLHA}
            >
              Cartão de crédito
            </button>
          )}
          {formasPagamento.aceita_pagamento_no_dia && (
            <button
              onClick={() => {
                setMetodoPagamento("no_local");
                setPasso("dados");
              }}
              className={CARTAO_ESCOLHA}
            >
              Pagar na retirada
            </button>
          )}
          <button onClick={() => setPasso("carrinho")} className={`${BOTAO_GHOST} w-fit`}>
            Voltar
          </button>
        </div>
      )}

      {passo === "dados" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">Seus dados</p>
          <p className="text-sm text-tenant-fg opacity-70">
            Total: <span className="font-medium tabular-nums">{centavosToBRL(totalCentavos)}</span>
          </p>
          <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input
            placeholder="WhatsApp, ex: (47) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          {(metodoPagamento === "pix" || metodoPagamento === "cartao") && (
            <Input
              type="email"
              placeholder="E-mail (necessário para o pagamento online)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          {metodoPagamento === "cartao" && !cartaoViaAsaas && (
            <Input
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              maxLength={14}
            />
          )}
          {pixExigeCpf && (
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
              {dadosCartaoCompletos && cartaoViaAsaas && (
                <button
                  disabled={pending}
                  onClick={() => {
                    setErro(null);
                    startTransition(async () => {
                      const r = await criarPedidoCartaoAsaas({
                        estabelecimentoId: estabelecimento.id,
                        itens: itensCarrinho,
                        nome,
                        telefone,
                        email,
                        slug: estabelecimento.slug,
                      });
                      if (r.error || !r.checkoutUrl || !r.token) {
                        setErro(r.error ?? "Erro ao criar checkout.");
                        return;
                      }
                      salvarTokenAgendamento(estabelecimento.slug, r.token);
                      window.location.href = r.checkoutUrl;
                    });
                  }}
                  className={BOTAO_PRIMARIO}
                >
                  {pending ? "Abrindo checkout..." : "Pagar agora (cartão, com parcelamento)"}
                </button>
              )}
              {dadosCartaoCompletos && !cartaoViaAsaas && formasPagamento.mercado_pago_public_key && (
                <CardPaymentBrick
                  publicKey={formasPagamento.mercado_pago_public_key}
                  valorCentavos={totalCentavos}
                  email={email}
                  cpf={apenasNumeros(cpf)}
                  onEnviar={(formData) =>
                    criarPedidoCartao({
                      estabelecimentoId: estabelecimento.id,
                      itens: itensCarrinho,
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
              {dadosCartaoCompletos && !cartaoViaAsaas && !formasPagamento.mercado_pago_public_key && (
                <FormError>Configuração de pagamento incompleta (public key ausente).</FormError>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPasso(podeEscolherFormaPagamento ? "pagamento" : "carrinho")}
                className={BOTAO_SECUNDARIO}
              >
                Voltar
              </button>
              <button
                disabled={
                  pending ||
                  !nome ||
                  !telefone ||
                  (metodoPagamento === "pix" && !email) ||
                  (pixExigeCpf && !validarCPF(cpf))
                }
                onClick={confirmar}
                className={BOTAO_PRIMARIO}
              >
                {pending ? "Confirmando..." : metodoPagamento === "pix" ? "Ir para pagamento" : "Confirmar pedido"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
