"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  buscarSlotsPublico,
  criarAgendamentoPublico,
  criarAgendamentoPix,
  criarAgendamentoCartao,
  consultarStatusPagamento,
} from "./actions";
import { CardPaymentBrick } from "@/components/payment/card-payment-brick";
import { SeletorData } from "./seletor-data";
import { salvarTokenAgendamento } from "../meu-agendamento-link";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, BOTAO_GHOST } from "../estilos";
import { ResultadoPagamento } from "../resultado-pagamento";
import { CarrinhoProdutos, type ProdutoCarrinho } from "../carrinho-produtos";
import { centavosToBRL } from "@/lib/money";
import { hojeNaTimezone } from "@/lib/timezone";
import { validarCPF, formatarCPF, apenasNumeros } from "@/lib/cpf";
import type { Database } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { FormError } from "@/components/ui/form-error";
import { Chip } from "@/components/ui/chip";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type FormasPagamento = {
  aceita_pagamento_antecipado: boolean;
  aceita_pagamento_no_dia: boolean;
  gateway_ativo: string;
  mercado_pago_public_key: string | null;
};
type MetodoPagamento = "no_local" | "pix" | "cartao";
type Passo = "servico" | "profissional" | "data" | "produtos" | "pagamento" | "dados";

const QUALQUER = "qualquer";

// Botões da página pública seguem as cores --tenant-* (variam por preset do estabelecimento),
// diferente do kit de UI do painel que usa a paleta fixa Navalha & Latão.
const CARTAO_ESCOLHA =
  "flex justify-between rounded-md border border-tenant-linha bg-tenant-bg p-3 text-left text-current transition-colors duration-150 hover:border-tenant-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";

type ProgramaFidelidadeServico = { servicoId: string; selosNecessarios: number; brinde: string };

export function AgendarWizard({
  estabelecimento,
  servicos,
  profissionais,
  vinculos,
  formasPagamento,
  produtos,
  programasFidelidade,
}: {
  estabelecimento: Estabelecimento;
  servicos: Servico[];
  profissionais: Profissional[];
  vinculos: { profissional_id: string; servico_id: string }[];
  formasPagamento: FormasPagamento;
  produtos: ProdutoCarrinho[];
  programasFidelidade: ProgramaFidelidadeServico[];
}) {
  const [passo, setPasso] = useState<Passo>("servico");
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [profissionalEscolha, setProfissionalEscolha] = useState<string | null>(null);
  const [data, setData] = useState(hojeNaTimezone(estabelecimento.timezone));
  const [slots, setSlots] = useState<{ inicio: string; fim: string }[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
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

  const temProdutos = produtos.length > 0;

  const gatewayMercadoPagoDisponivel =
    formasPagamento.aceita_pagamento_antecipado && formasPagamento.gateway_ativo === "mercado_pago";
  const opcoesPagamento: MetodoPagamento[] = [
    ...(gatewayMercadoPagoDisponivel ? (["pix", "cartao"] as const) : []),
    ...(formasPagamento.aceita_pagamento_no_dia ? (["no_local"] as const) : []),
  ];
  const podeEscolherFormaPagamento = opcoesPagamento.length > 1;

  const passosAtivos: Passo[] = [
    "servico",
    "profissional",
    "data",
    ...(temProdutos ? (["produtos"] as const) : []),
    ...(podeEscolherFormaPagamento ? (["pagamento"] as const) : []),
    "dados",
  ];
  const numero = (p: Passo) => passosAtivos.indexOf(p) + 1;

  const servicoSelecionado = servicos.find((s) => s.id === servicoId) ?? null;
  const programaDoServicoSelecionado = programasFidelidade.find((p) => p.servicoId === servicoId) ?? null;
  const totalProdutosCentavos = Object.entries(carrinho).reduce((soma, [produtoId, qtd]) => {
    const produto = produtos.find((p) => p.id === produtoId);
    return soma + (produto ? produto.preco_centavos * qtd : 0);
  }, 0);
  const totalCentavos = (servicoSelecionado?.preco_centavos ?? 0) + totalProdutosCentavos;
  const itensCarrinho = Object.entries(carrinho)
    .filter(([, qtd]) => qtd > 0)
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));

  const profissionaisQualificados = useMemo(
    () =>
      profissionais.filter((p) =>
        vinculos.some((v) => v.profissional_id === p.id && v.servico_id === servicoId)
      ),
    [profissionais, vinculos, servicoId]
  );

  const profissionalId =
    profissionalEscolha === QUALQUER ? profissionaisQualificados[0]?.id ?? null : profissionalEscolha;

  useEffect(() => {
    let ignorar = false;
    async function carregar() {
      const resultado =
        profissionalId && servicoId && data
          ? await buscarSlotsPublico(estabelecimento.id, profissionalId, servicoId, data)
          : [];
      if (!ignorar) setSlots(resultado);
    }
    carregar();
    return () => {
      ignorar = true;
    };
  }, [estabelecimento.id, profissionalId, servicoId, data]);

  // Poll do status do pagamento (Pix ou cartão pendente) ate confirmar, via webhook do Mercado Pago.
  useEffect(() => {
    const pendente = resultadoPix ?? aguardandoCartao;
    const jaConfirmado = pixConfirmado || cartaoConfirmado;
    if (!pendente || jaConfirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await consultarStatusPagamento(pendente.pagamentoId, pendente.token);
      if (!ignorar && status?.status_agendamento === "confirmado") {
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

  function irDeDataParaProximo() {
    if (temProdutos) {
      setPasso("produtos");
    } else {
      irParaFormaPagamentoOuDados();
    }
  }

  function confirmar() {
    if (!profissionalId || !servicoId || !slotSelecionado || !metodoPagamento) return;
    setErro(null);

    if (metodoPagamento === "no_local") {
      startTransition(async () => {
        const r = await criarAgendamentoPublico({
          estabelecimentoId: estabelecimento.id,
          profissionalId,
          servicoId,
          inicio: slotSelecionado,
          nome,
          telefone,
          itens: itensCarrinho.length > 0 ? itensCarrinho : undefined,
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
        const r = await criarAgendamentoPix({
          estabelecimentoId: estabelecimento.id,
          profissionalId,
          servicoId,
          inicio: slotSelecionado,
          nome,
          telefone,
          email,
          itens: itensCarrinho.length > 0 ? itensCarrinho : undefined,
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
        linkLabel="Ver meu agendamento"
        tituloConfirmado="Pagamento confirmado"
        mensagemConfirmado="Seu agendamento está confirmado."
      />
    );
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-3">
        <Heading className="text-tenant-fg">Agendamento confirmado</Heading>
        <p className="text-tenant-fg opacity-80">Você vai receber a confirmação pelo WhatsApp informado.</p>
        <Link href={`/b/${estabelecimento.slug}/meus-agendamentos/${resultado.token}`} className={BOTAO_GHOST}>
          Ver ou cancelar meu agendamento
        </Link>
      </div>
    );
  }

  const dadosCartaoCompletos =
    metodoPagamento === "cartao" && !!nome && !!telefone && !!email && validarCPF(cpf);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-tenant-fg">Agendar em {estabelecimento.nome}</h1>

      {passo === "servico" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">1. Escolha o serviço</p>
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoId(s.id);
                setProfissionalEscolha(null);
                setSlotSelecionado(null);
                setPasso("profissional");
              }}
              className={CARTAO_ESCOLHA}
            >
              <span className="flex flex-col items-start gap-0.5">
                <span>{s.nome}</span>
                {programasFidelidade.some((p) => p.servicoId === s.id) && (
                  <span className="text-xs text-tenant-acento">Participa do cartão fidelidade</span>
                )}
              </span>
              <span className="tabular-nums">{centavosToBRL(s.preco_centavos)}</span>
            </button>
          ))}
        </div>
      )}

      {passo === "profissional" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">2. Escolha o profissional</p>
          {programaDoServicoSelecionado && (
            <p className="rounded-md border border-tenant-linha bg-tenant-bg p-3 text-sm text-tenant-fg">
              Esse serviço participa do cartão fidelidade: a cada visita você ganha um selo.
              Complete {programaDoServicoSelecionado.selosNecessarios} e ganhe{" "}
              <span className="font-medium">{programaDoServicoSelecionado.brinde}</span>.
            </p>
          )}
          {profissionaisQualificados.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProfissionalEscolha(p.id);
                setSlotSelecionado(null);
                setPasso("data");
              }}
              className={CARTAO_ESCOLHA}
            >
              {p.nome}
            </button>
          ))}
          <button
            onClick={() => {
              setProfissionalEscolha(QUALQUER);
              setSlotSelecionado(null);
              setPasso("data");
            }}
            className={CARTAO_ESCOLHA}
          >
            Qualquer profissional disponível
          </button>
          <button onClick={() => setPasso("servico")} className={`${BOTAO_GHOST} w-fit`}>
            Voltar
          </button>
        </div>
      )}

      {passo === "data" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">3. Escolha data e horário</p>
          <SeletorData
            value={data}
            min={hojeNaTimezone(estabelecimento.timezone)}
            onChange={(novaData) => {
              setData(novaData);
              setSlotSelecionado(null);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const hora = new Date(s.inicio).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Chip key={s.inicio} selected={slotSelecionado === s.inicio} onClick={() => setSlotSelecionado(s.inicio)}>
                  {hora}
                </Chip>
              );
            })}
            {slots.length === 0 && (
              <p className="text-sm text-tenant-fg opacity-70">Sem horários livres nesse dia.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPasso("profissional")} className={BOTAO_SECUNDARIO}>
              Voltar
            </button>
            <button disabled={!slotSelecionado} onClick={irDeDataParaProximo} className={BOTAO_PRIMARIO}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {passo === "produtos" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">
            {numero("produtos")}. Quer levar algum produto?
          </p>
          <CarrinhoProdutos
            produtos={produtos}
            carrinho={carrinho}
            onChange={(produtoId, quantidade) =>
              setCarrinho((prev) => ({ ...prev, [produtoId]: quantidade }))
            }
          />
          <div className="flex gap-2">
            <button onClick={() => setPasso("data")} className={BOTAO_SECUNDARIO}>
              Voltar
            </button>
            <button onClick={irParaFormaPagamentoOuDados} className={BOTAO_PRIMARIO}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {passo === "pagamento" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">{numero("pagamento")}. Forma de pagamento</p>
          {gatewayMercadoPagoDisponivel && (
            <>
              <button
                onClick={() => {
                  setMetodoPagamento("pix");
                  setPasso("dados");
                }}
                className={CARTAO_ESCOLHA}
              >
                Pagar agora (Pix)
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
            </>
          )}
          {formasPagamento.aceita_pagamento_no_dia && (
            <button
              onClick={() => {
                setMetodoPagamento("no_local");
                setPasso("dados");
              }}
              className={CARTAO_ESCOLHA}
            >
              Pagar no dia
            </button>
          )}
          <button onClick={() => setPasso(temProdutos ? "produtos" : "data")} className={`${BOTAO_GHOST} w-fit`}>
            Voltar
          </button>
        </div>
      )}

      {passo === "dados" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">{numero("dados")}. Seus dados</p>
          {totalProdutosCentavos > 0 && (
            <p className="text-sm text-tenant-fg opacity-70">
              Serviço + produtos: <span className="font-medium tabular-nums">{centavosToBRL(totalCentavos)}</span>
            </p>
          )}
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
              {dadosCartaoCompletos && servicoSelecionado && formasPagamento.mercado_pago_public_key && (
                <CardPaymentBrick
                  publicKey={formasPagamento.mercado_pago_public_key}
                  valorCentavos={totalCentavos}
                  email={email}
                  cpf={apenasNumeros(cpf)}
                  onEnviar={(formData) =>
                    criarAgendamentoCartao({
                      estabelecimentoId: estabelecimento.id,
                      profissionalId: profissionalId!,
                      servicoId: servicoId!,
                      inicio: slotSelecionado!,
                      nome,
                      telefone,
                      email,
                      cpf,
                      formData,
                      itens: itensCarrinho.length > 0 ? itensCarrinho : undefined,
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
              <button
                onClick={() => setPasso(podeEscolherFormaPagamento ? "pagamento" : temProdutos ? "produtos" : "data")}
                className={BOTAO_SECUNDARIO}
              >
                Voltar
              </button>
              <button
                disabled={pending || !nome || !telefone || (metodoPagamento === "pix" && !email)}
                onClick={confirmar}
                className={BOTAO_PRIMARIO}
              >
                {pending ? "Confirmando..." : metodoPagamento === "pix" ? "Ir para pagamento" : "Confirmar agendamento"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
