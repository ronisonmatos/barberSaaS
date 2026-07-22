"use client";

import { Fragment, useState, useTransition } from "react";
import { cancelarAssinatura } from "./actions";
import { desativarHorarioFixo } from "./actions-horario-fixo";
import { HorarioFixoForm } from "./horario-fixo-form";
import { RenovarAssinaturaForm } from "./renovar-assinatura-form";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

type HorarioFixo = {
  id: string;
  servicoId: string;
  profissionalId: string;
  tipoRecorrencia: "intervalo" | "mensal";
  intervaloDias: number | null;
  diaSemana: number | null;
  ordinalSemana: number | null;
  horario: string;
  proximaData: string;
  reservarAutomaticamente: boolean;
  ativo: boolean;
};

export type AssinaturaDetalhada = {
  id: string;
  status: "pendente" | "ativa" | "inadimplente" | "cancelada" | "pausada";
  cicloInicio: string;
  cicloFim: string;
  usosCiclo: Record<string, number>;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  planoNome: string;
  planoPrecoCentavos: number;
  servicosCobertos: { servicoId: string; servicoNome: string; quantidadeMes: number }[];
  horariosFixos: HorarioFixo[];
};

const DIAS_SEMANA_LABEL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const ORDINAL_LABEL: Record<number, string> = { 1: "1º", 2: "2º", 3: "3º", 4: "4º", "-1": "último" };

function resumoRecorrencia(h: HorarioFixo): string {
  if (h.tipoRecorrencia === "mensal" && h.diaSemana !== null && h.ordinalSemana !== null) {
    return `${ORDINAL_LABEL[h.ordinalSemana]} ${DIAS_SEMANA_LABEL[h.diaSemana]} do mês, ${h.horario.slice(0, 5)}`;
  }
  return `A cada ${h.intervaloDias}d, ${h.horario.slice(0, 5)}`;
}

function temServicoComVaga(a: AssinaturaDetalhada): boolean {
  return a.servicosCobertos.some((s) => {
    const usados = a.horariosFixos.filter((h) => h.servicoId === s.servicoId).length;
    return usados < s.quantidadeMes;
  });
}

const STATUS_LABEL: Record<AssinaturaDetalhada["status"], string> = {
  pendente: "Aguardando pagamento",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  cancelada: "Cancelada",
  pausada: "Pausada",
};

const STATUS_COR: Record<AssinaturaDetalhada["status"], string> = {
  pendente: "text-aviso",
  ativa: "text-sucesso",
  inadimplente: "text-erro",
  cancelada: "text-cinza-600",
  pausada: "text-cinza-600",
};

export function AssinaturasClient({
  assinaturas,
  podeCancelar,
  podeConfigurarHorarioFixo,
  meuProfissionalId,
  profissionaisPorServico,
}: {
  assinaturas: AssinaturaDetalhada[];
  podeCancelar: boolean;
  podeConfigurarHorarioFixo: boolean;
  meuProfissionalId: string | null;
  profissionaisPorServico: Record<string, { id: string; nome: string }[]>;
}) {
  const [pending, startTransition] = useTransition();
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gerenciando, setGerenciando] = useState<string | null>(null);
  // "novo" = criando uma entrada nova; string = editando essa entrada; null = so a lista, sem form aberto
  const [formAberto, setFormAberto] = useState<string | "novo" | null>(null);
  const [renovando, setRenovando] = useState<string | null>(null);

  function cancelar(id: string) {
    setErro(null);
    setCancelando(id);
    startTransition(async () => {
      const r = await cancelarAssinatura(id);
      if (r.error) setErro(r.error);
      setCancelando(null);
    });
  }

  function desativar(id: string) {
    setErro(null);
    startTransition(async () => {
      const r = await desativarHorarioFixo(id);
      if (r.error) setErro(r.error);
    });
  }

  function abrirGerenciar(assinaturaId: string) {
    setFormAberto(null);
    setRenovando(null);
    setGerenciando(gerenciando === assinaturaId ? null : assinaturaId);
  }

  function abrirRenovar(assinaturaId: string) {
    setGerenciando(null);
    setRenovando(renovando === assinaturaId ? null : assinaturaId);
  }

  const totalUsos = (usos: Record<string, number>) => Object.values(usos).reduce((soma, n) => soma + n, 0);

  return (
    <div className="flex flex-col gap-3">
      {erro && <FormError>{erro}</FormError>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-linha text-left text-cinza-600">
              <th className="py-2 font-medium">Cliente</th>
              <th className="font-medium">Plano</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Ciclo até</th>
              <th className="font-medium">Usos no ciclo</th>
              <th className="font-medium">Horário fixo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assinaturas.map((a) => (
              <Fragment key={a.id}>
                <tr className="border-b border-linha text-carvao hover:bg-marfim">
                  <td className="py-2">
                    <p>{a.clienteNome}</p>
                    <p className="text-xs text-cinza-600">{a.clienteTelefone}</p>
                  </td>
                  <td>
                    {a.planoNome}
                    <p className="text-xs text-cinza-600 tabular-nums">{centavosToBRL(a.planoPrecoCentavos)}/mês</p>
                  </td>
                  <td className={STATUS_COR[a.status]}>{STATUS_LABEL[a.status]}</td>
                  <td className="tabular-nums">
                    {a.status === "pendente" ? "—" : new Date(a.cicloFim).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="tabular-nums">{totalUsos(a.usosCiclo)}</td>
                  <td>
                    {a.horariosFixos.length > 0 ? (
                      a.horariosFixos.map((h) => (
                        <p key={h.id} className="text-xs">
                          {resumoRecorrencia(h)} ({h.reservarAutomaticamente ? "auto" : "lembrete"})
                        </p>
                      ))
                    ) : (
                      <span className="text-cinza-600">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {podeConfigurarHorarioFixo && a.status === "ativa" && a.servicosCobertos.length > 0 && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => abrirGerenciar(a.id)}
                          className="text-sm text-carvao underline"
                        >
                          {gerenciando === a.id ? "Fechar" : "Gerenciar horários fixos"}
                        </button>
                      )}
                      {a.status !== "pendente" && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => abrirRenovar(a.id)}
                          className="text-sm text-carvao underline"
                        >
                          {renovando === a.id ? "Fechar" : "Renovar"}
                        </button>
                      )}
                      {podeCancelar && a.status !== "cancelada" && (
                        <Button variant="perigo" disabled={pending} onClick={() => cancelar(a.id)}>
                          {cancelando === a.id ? "Cancelando..." : "Cancelar"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {renovando === a.id && (
                  <tr className="border-b border-linha">
                    <td colSpan={7} className="py-3">
                      <RenovarAssinaturaForm
                        assinaturaId={a.id}
                        clienteNome={a.clienteNome}
                        clienteTelefone={a.clienteTelefone}
                        clienteEmail={a.clienteEmail}
                        onDone={() => setRenovando(null)}
                      />
                    </td>
                  </tr>
                )}
                {gerenciando === a.id && (
                  <tr className="border-b border-linha">
                    <td colSpan={7} className="py-3">
                      <div className="flex flex-col gap-3">
                        {a.horariosFixos.map((h) =>
                          formAberto === h.id ? (
                            <HorarioFixoForm
                              key={h.id}
                              assinaturaClienteId={a.id}
                              servicosCobertos={a.servicosCobertos}
                              profissionaisPorServico={profissionaisPorServico}
                              horarioFixo={h}
                              onDone={() => setFormAberto(null)}
                            />
                          ) : (
                            <div
                              key={h.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-linha bg-marfim-2 p-3 text-sm"
                            >
                              <div>
                                <p>
                                  {a.servicosCobertos.find((s) => s.servicoId === h.servicoId)?.servicoNome ?? "—"} —{" "}
                                  {resumoRecorrencia(h)}
                                </p>
                                <p className="text-xs text-cinza-600">
                                  {h.reservarAutomaticamente ? "Reserva automática" : "Só lembrete"}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                {(podeCancelar || h.profissionalId === meuProfissionalId) && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setFormAberto(h.id)}
                                      className="text-sm text-carvao underline"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      disabled={pending}
                                      onClick={() => desativar(h.id)}
                                      className="text-sm text-cinza-600 underline hover:text-erro"
                                    >
                                      Remover
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        )}

                        {formAberto === "novo" ? (
                          <HorarioFixoForm
                            assinaturaClienteId={a.id}
                            servicosCobertos={a.servicosCobertos}
                            profissionaisPorServico={profissionaisPorServico}
                            horarioFixo={null}
                            onDone={() => setFormAberto(null)}
                          />
                        ) : (
                          temServicoComVaga(a) && (
                            <Button
                              type="button"
                              variant="secondary"
                              className="w-fit"
                              onClick={() => setFormAberto("novo")}
                            >
                              + Adicionar horário fixo
                            </Button>
                          )
                        )}
                        {!temServicoComVaga(a) && formAberto !== "novo" && (
                          <p className="text-xs text-cinza-600">
                            Todos os serviços cobertos pelo plano já têm horário fixo configurado
                            pra quantidade que o plano permite por mês.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
