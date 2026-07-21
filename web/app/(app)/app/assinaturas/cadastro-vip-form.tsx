"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cadastrarClienteVipPix, statusAssinaturaVip } from "./actions-cadastro-vip";
import { HorarioFixoForm } from "./horario-fixo-form";
import { HorarioFixoCampos } from "./horario-fixo-campos";
import { centavosToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Plano = {
  id: string;
  nome: string;
  precoCentavos: number;
  servicosCobertos: { servicoId: string; servicoNome: string }[];
};

export function CadastroVipForm({
  planos,
  podeConfigurarHorarioFixo,
  profissionaisPorServico,
  onDone,
}: {
  planos: Plano[];
  podeConfigurarHorarioFixo: boolean;
  profissionaisPorServico: Record<string, { id: string; nome: string }[]>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [planoId, setPlanoId] = useState(planos[0]?.id ?? "");
  const [incluirHorarioFixo, setIncluirHorarioFixo] = useState(false);
  const [servicoId, setServicoId] = useState(planos[0]?.servicosCobertos[0]?.servicoId ?? "");
  const [tipoRecorrencia, setTipoRecorrencia] = useState<"intervalo" | "mensal">("intervalo");
  const [pix, setPix] = useState<{ assinaturaId: string; pagamentoId: string; qrCode: string; qrCodeBase64: string } | null>(
    null
  );
  const [horarioFixoJaIncluido, setHorarioFixoJaIncluido] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [configurarHorarioDepois, setConfigurarHorarioDepois] = useState(false);

  const planoSelecionado = planos.find((p) => p.id === planoId) ?? null;
  const servicosCobertos = planoSelecionado?.servicosCobertos ?? [];
  const profissionaisDisponiveis = profissionaisPorServico[servicoId] ?? [];

  useEffect(() => {
    if (!pix || confirmado) return;
    let ignorar = false;
    const intervalo = setInterval(async () => {
      const status = await statusAssinaturaVip(pix.pagamentoId);
      if (!ignorar && status.assinaturaStatus === "ativa") {
        setConfirmado(true);
        router.refresh();
      }
    }, 4000);
    return () => {
      ignorar = true;
      clearInterval(intervalo);
    };
  }, [pix, confirmado, router]);

  function enviar(formData: FormData) {
    setErro(null);
    formData.set("incluirHorarioFixo", incluirHorarioFixo ? "on" : "off");
    if (incluirHorarioFixo) formData.set("tipoRecorrencia", tipoRecorrencia);
    startTransition(async () => {
      const r = await cadastrarClienteVipPix(formData);
      if (r.error || !r.qrCode || !r.qrCodeBase64 || !r.pagamentoId || !r.assinaturaId) {
        setErro(r.error ?? "Erro ao gerar cobrança Pix.");
        return;
      }
      setHorarioFixoJaIncluido(incluirHorarioFixo);
      setPix({ assinaturaId: r.assinaturaId, pagamentoId: r.pagamentoId, qrCode: r.qrCode, qrCodeBase64: r.qrCodeBase64 });
    });
  }

  if (confirmado && pix) {
    if (configurarHorarioDepois) {
      return (
        <div className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
          <p className="font-medium text-sucesso">Pagamento confirmado! Agora configure o horário fixo:</p>
          <HorarioFixoForm
            assinaturaClienteId={pix.assinaturaId}
            servicosCobertos={servicosCobertos}
            profissionaisPorServico={profissionaisPorServico}
            horarioFixo={null}
            onDone={onDone}
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
        <p className="font-medium text-sucesso">Pagamento confirmado! Assinatura ativa.</p>
        {horarioFixoJaIncluido ? (
          <p className="text-cinza-600">
            O horário fixo já está configurado — a reserva na agenda passa a valer a partir de
            agora.
          </p>
        ) : (
          <p className="text-cinza-600">Esse cliente ainda não tem horário fixo configurado.</p>
        )}
        <div className="flex gap-2">
          {!horarioFixoJaIncluido && podeConfigurarHorarioFixo && servicosCobertos.length > 0 && (
            <Button type="button" onClick={() => setConfigurarHorarioDepois(true)}>
              Configurar horário fixo agora
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onDone}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  if (pix) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-center text-sm">
        <p className="font-medium">Peça pro cliente pagar o Pix para confirmar a assinatura</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem base64 gerada em runtime, sem otimização aplicável */}
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR code Pix"
          className="h-56 w-56 rounded-md border border-linha"
        />
        <textarea
          readOnly
          value={pix.qrCode}
          onClick={(e) => e.currentTarget.select()}
          rows={3}
          className="w-full rounded-md border border-linha bg-marfim p-2 text-xs text-carvao"
        />
        <p className="text-xs text-cinza-600">
          Confirmamos automaticamente assim que o pagamento cair.
          {horarioFixoJaIncluido
            ? " O horário fixo já está configurado e passa a valer assim que confirmar."
            : ""}{" "}
          Pode deixar essa tela aberta ou voltar depois em Assinaturas.
        </p>
        <Button type="button" variant="secondary" onClick={onDone}>
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-3 rounded-md border border-linha bg-marfim-2 p-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="font-medium">Nome do cliente</label>
          <Input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Telefone (WhatsApp)</label>
          <Input name="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">E-mail</label>
          <Input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Plano</label>
          <select
            name="planoId"
            value={planoId}
            onChange={(e) => {
              const novoPlanoId = e.target.value;
              setPlanoId(novoPlanoId);
              const novoPlano = planos.find((p) => p.id === novoPlanoId);
              setServicoId(novoPlano?.servicosCobertos[0]?.servicoId ?? "");
            }}
            className="h-11 rounded-sm border border-linha bg-marfim-2 px-3 text-sm text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          >
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {centavosToBRL(p.precoCentavos)}/mês
              </option>
            ))}
          </select>
        </div>
      </div>

      {podeConfigurarHorarioFixo && (
        <div className="flex flex-col gap-3 border-t border-linha pt-3">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={incluirHorarioFixo}
              onChange={(e) => setIncluirHorarioFixo(e.target.checked)}
              disabled={servicosCobertos.length === 0}
            />
            Já configurar horário fixo agora
          </label>
          {incluirHorarioFixo && (
            <HorarioFixoCampos
              servicoId={servicoId}
              setServicoId={setServicoId}
              tipoRecorrencia={tipoRecorrencia}
              setTipoRecorrencia={setTipoRecorrencia}
              servicosCobertos={servicosCobertos}
              profissionaisDisponiveis={profissionaisDisponiveis}
              horarioFixo={null}
            />
          )}
        </div>
      )}

      <p className="text-xs text-cinza-600">
        Gera uma cobrança Pix do 1º ciclo. Assim que o cliente pagar, a assinatura ativa
        automaticamente — o mesmo fluxo de quando ele assina sozinho pela página pública.
        {incluirHorarioFixo && " O horário fixo já fica configurado, mas só passa a travar a agenda depois que o pagamento confirmar."}
      </p>

      {erro && <FormError>{erro}</FormError>}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending || !planoId || (incluirHorarioFixo && profissionaisDisponiveis.length === 0)}
        >
          {pending ? "Gerando cobrança..." : "Gerar cobrança Pix"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
