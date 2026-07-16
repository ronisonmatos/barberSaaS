"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { buscarSlotsPublico, criarAgendamentoPublico, criarAgendamentoPix, consultarStatusPagamento } from "./actions";
import { salvarTokenAgendamento } from "../meu-agendamento-link";
import { centavosToBRL } from "@/lib/money";
import { hojeNaTimezone } from "@/lib/timezone";
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
type MetodoPagamento = "no_local" | "pix";

const QUALQUER = "qualquer";

// Botões da página pública seguem as cores --tenant-* (variam por preset do estabelecimento),
// diferente do kit de UI do painel que usa a paleta fixa Navalha & Latão.
const BOTAO_PRIMARIO =
  "inline-flex h-11 items-center justify-center rounded-md bg-tenant-acento px-4 text-sm font-medium text-tenant-acento-fg transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";
const BOTAO_SECUNDARIO =
  "inline-flex h-11 items-center justify-center rounded-md border border-tenant-linha px-4 text-sm font-medium text-current transition-colors duration-150 hover:border-tenant-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";
const BOTAO_GHOST = "text-sm text-current underline opacity-70 hover:opacity-100";
const CARTAO_ESCOLHA =
  "flex justify-between rounded-md border border-tenant-linha bg-tenant-bg-2 p-3 text-left text-current transition-colors duration-150 hover:border-tenant-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";

export function AgendarWizard({
  estabelecimento,
  servicos,
  profissionais,
  vinculos,
  formasPagamento,
}: {
  estabelecimento: Estabelecimento;
  servicos: Servico[];
  profissionais: Profissional[];
  vinculos: { profissional_id: string; servico_id: string }[];
  formasPagamento: FormasPagamento;
}) {
  const [passo, setPasso] = useState(1);
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [profissionalEscolha, setProfissionalEscolha] = useState<string | null>(null);
  const [data, setData] = useState(hojeNaTimezone(estabelecimento.timezone));
  const [slots, setSlots] = useState<{ inicio: string; fim: string }[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
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

  const podeEscolherFormaPagamento =
    formasPagamento.aceita_pagamento_antecipado && formasPagamento.aceita_pagamento_no_dia;
  const gatewayPixDisponivel = formasPagamento.gateway_ativo === "mercado_pago";

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

  // Poll do status do pagamento Pix ate confirmar (webhook do Mercado Pago atualiza no banco).
  useEffect(() => {
    if (!resultadoPix || pixConfirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await consultarStatusPagamento(resultadoPix.pagamentoId, resultadoPix.token);
      if (!ignorar && status?.status_agendamento === "confirmado") {
        setPixConfirmado(true);
      }
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [resultadoPix, pixConfirmado]);

  function irParaFormaPagamentoOuDados() {
    if (podeEscolherFormaPagamento) {
      setPasso(4);
    } else {
      setMetodoPagamento(formasPagamento.aceita_pagamento_antecipado ? "pix" : "no_local");
      setPasso(5);
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

    startTransition(async () => {
      const r = await criarAgendamentoPix({
        estabelecimentoId: estabelecimento.id,
        profissionalId,
        servicoId,
        inicio: slotSelecionado,
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

  if (resultadoPix) {
    if (pixConfirmado) {
      return (
        <div className="flex flex-col gap-3">
          <Heading className="text-tenant-fg">Pagamento confirmado</Heading>
          <p className="text-tenant-fg opacity-80">Seu agendamento está confirmado.</p>
          <Link href={`/b/${estabelecimento.slug}/meus-agendamentos/${resultadoPix.token}`} className={BOTAO_GHOST}>
            Ver meu agendamento
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Heading className="text-tenant-fg">Pague com Pix para confirmar</Heading>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem base64 gerada em runtime, sem otimização aplicável */}
        <img
          src={`data:image/png;base64,${resultadoPix.qrCodeBase64}`}
          alt="QR code Pix"
          className="h-56 w-56 rounded-md border border-tenant-linha"
        />
        <textarea
          readOnly
          value={resultadoPix.qrCode}
          onClick={(e) => e.currentTarget.select()}
          rows={3}
          className="w-full rounded-md border border-tenant-linha bg-tenant-bg-2 p-2 text-xs text-tenant-fg"
        />
        <p className="text-sm text-tenant-fg opacity-70">
          Copie o código acima ou escaneie o QR code no app do seu banco. Confirmamos automaticamente assim
          que o pagamento cair.
        </p>
      </div>
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

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-tenant-fg">Agendar em {estabelecimento.nome}</h1>

      {passo === 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">1. Escolha o serviço</p>
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoId(s.id);
                setProfissionalEscolha(null);
                setSlotSelecionado(null);
                setPasso(2);
              }}
              className={CARTAO_ESCOLHA}
            >
              <span>{s.nome}</span>
              <span className="tabular-nums">{centavosToBRL(s.preco_centavos)}</span>
            </button>
          ))}
        </div>
      )}

      {passo === 2 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">2. Escolha o profissional</p>
          {profissionaisQualificados.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProfissionalEscolha(p.id);
                setSlotSelecionado(null);
                setPasso(3);
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
              setPasso(3);
            }}
            className={CARTAO_ESCOLHA}
          >
            Qualquer profissional disponível
          </button>
          <button onClick={() => setPasso(1)} className={`${BOTAO_GHOST} w-fit`}>
            Voltar
          </button>
        </div>
      )}

      {passo === 3 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">3. Escolha data e horário</p>
          <Input
            type="date"
            value={data}
            min={hojeNaTimezone(estabelecimento.timezone)}
            onChange={(e) => {
              setData(e.target.value);
              setSlotSelecionado(null);
            }}
            className="w-fit"
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
            <button onClick={() => setPasso(2)} className={BOTAO_SECUNDARIO}>
              Voltar
            </button>
            <button disabled={!slotSelecionado} onClick={irParaFormaPagamentoOuDados} className={BOTAO_PRIMARIO}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {passo === 4 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-tenant-fg opacity-70">4. Forma de pagamento</p>
          {gatewayPixDisponivel && (
            <button
              onClick={() => {
                setMetodoPagamento("pix");
                setPasso(5);
              }}
              className={CARTAO_ESCOLHA}
            >
              Pagar agora (Pix)
            </button>
          )}
          <button
            onClick={() => {
              setMetodoPagamento("no_local");
              setPasso(5);
            }}
            className={CARTAO_ESCOLHA}
          >
            Pagar no dia
          </button>
          <button onClick={() => setPasso(3)} className={`${BOTAO_GHOST} w-fit`}>
            Voltar
          </button>
        </div>
      )}

      {passo === 5 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-tenant-fg opacity-70">
            {podeEscolherFormaPagamento ? "5." : "4."} Seus dados
          </p>
          <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input
            placeholder="WhatsApp, ex: (47) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          {metodoPagamento === "pix" && (
            <Input
              type="email"
              placeholder="E-mail (necessário para o Pix)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          {erro && <FormError>{erro}</FormError>}
          <div className="flex gap-2">
            <button onClick={() => setPasso(podeEscolherFormaPagamento ? 4 : 3)} className={BOTAO_SECUNDARIO}>
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
        </div>
      )}
    </div>
  );
}
