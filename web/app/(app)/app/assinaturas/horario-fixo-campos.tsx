"use client";

import { Input } from "@/components/ui/input";

export type Servico = { servicoId: string; servicoNome: string };
export type Profissional = { id: string; nome: string };
export type HorarioFixo = {
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

const SELECT_CLASS =
  "h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-sm text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDINAIS = [
  { valor: 1, label: "1º" },
  { valor: 2, label: "2º" },
  { valor: 3, label: "3º" },
  { valor: 4, label: "4º" },
  { valor: -1, label: "Último" },
];

/**
 * Só os campos (sem <form>/submit) -- reaproveitado tanto no formulário isolado de editar horário
 * fixo (HorarioFixoForm) quanto embutido dentro do cadastro de cliente VIP (CadastroVipForm), que
 * já tem seu próprio <form> e não pode aninhar outro.
 */
export function HorarioFixoCampos({
  servicoId,
  setServicoId,
  tipoRecorrencia,
  setTipoRecorrencia,
  servicosCobertos,
  profissionaisDisponiveis,
  horarioFixo,
}: {
  servicoId: string;
  setServicoId: (v: string) => void;
  tipoRecorrencia: "intervalo" | "mensal";
  setTipoRecorrencia: (v: "intervalo" | "mensal") => void;
  servicosCobertos: Servico[];
  profissionaisDisponiveis: Profissional[];
  horarioFixo: HorarioFixo | null;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="font-medium">Serviço</label>
          {servicosCobertos.length > 1 ? (
            <select
              name="servicoId"
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              className={SELECT_CLASS}
            >
              {servicosCobertos.map((s) => (
                <option key={s.servicoId} value={s.servicoId}>
                  {s.servicoNome}
                </option>
              ))}
            </select>
          ) : (
            <>
              <p className="flex h-11 items-center rounded-sm border border-linha bg-marfim px-3 text-carvao">
                {servicosCobertos[0]?.servicoNome ?? "—"}
              </p>
              <input type="hidden" name="servicoId" value={servicoId} />
            </>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Profissional</label>
          <select name="profissionalId" defaultValue={horarioFixo?.profissionalId ?? ""} className={SELECT_CLASS}>
            <option value="" disabled>
              Selecione
            </option>
            {profissionaisDisponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-medium">Repete...</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="tipoRecorrenciaRadio"
              checked={tipoRecorrencia === "intervalo"}
              onChange={() => setTipoRecorrencia("intervalo")}
            />
            A cada N dias
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="tipoRecorrenciaRadio"
              checked={tipoRecorrencia === "mensal"}
              onChange={() => setTipoRecorrencia("mensal")}
            />
            Todo Nº dia da semana do mês
          </label>
        </div>
      </div>

      {tipoRecorrencia === "intervalo" ? (
        <div className="flex flex-col gap-1 sm:w-1/2 sm:pr-1.5">
          <label className="font-medium">A cada quantos dias</label>
          <Input type="number" name="intervaloDias" min={1} max={90} defaultValue={horarioFixo?.intervaloDias ?? 30} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="font-medium">Posição no mês</label>
            <select name="ordinalSemana" defaultValue={horarioFixo?.ordinalSemana ?? 1} className={SELECT_CLASS}>
              {ORDINAIS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium">Dia da semana</label>
            <select name="diaSemana" defaultValue={horarioFixo?.diaSemana ?? 6} className={SELECT_CLASS}>
              {DIAS_SEMANA.map((nome, i) => (
                <option key={i} value={i}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="font-medium">Horário</label>
          <Input type="time" name="horario" defaultValue={horarioFixo?.horario?.slice(0, 5) ?? ""} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Próxima data</label>
          <Input type="date" name="proximaData" defaultValue={horarioFixo?.proximaData ?? ""} required />
        </div>
      </div>

      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          name="reservarAutomaticamente"
          defaultChecked={horarioFixo?.reservarAutomaticamente ?? false}
        />
        Reservar automaticamente na agenda
      </label>
      <p className="text-xs text-cinza-600">
        Se marcado, o sistema cria o agendamento sozinho com antecedência (consumindo a cota do
        plano) -- só passa a valer depois que o pagamento da assinatura confirmar. Se não conseguir
        (horário ocupado, cota esgotada), pula aquele ciclo e avisa a equipe. Se desmarcado, fica só
        como lembrete para a equipe agendar manualmente.
      </p>
      {profissionaisDisponiveis.length === 0 && (
        <p className="text-xs text-erro">Nenhum profissional ativo realiza esse serviço.</p>
      )}
    </>
  );
}
