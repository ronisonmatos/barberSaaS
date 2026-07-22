import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { AssinaturasClient, type AssinaturaDetalhada } from "./assinaturas-client";
import { CadastroVipSection } from "./cadastro-vip-section";
import { Heading } from "@/components/ui/heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Repeat } from "lucide-react";

type Regra = { servico_id: string; quantidade_mes: number };

export default async function AssinaturasPage() {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const [
    { data: assinaturas },
    { data: servicos },
    { data: profissionais },
    { data: profissionalServicos },
    { data: horariosFixos },
    { data: planosAtivos },
    { data: meuProfissional },
  ] = await Promise.all([
    supabase
      .from("assinaturas_clientes")
      .select(
        "id, status, ciclo_inicio, ciclo_fim, usos_ciclo, clientes(nome, telefone, email), planos_estabelecimento(nome, preco_centavos, regras)"
      )
      .eq("estabelecimento_id", estabelecimento.id)
      .order("created_at", { ascending: false }),
    supabase.from("servicos").select("id, nome").eq("estabelecimento_id", estabelecimento.id),
    supabase.from("profissionais").select("id, nome").eq("estabelecimento_id", estabelecimento.id).eq("ativo", true).order("nome"),
    supabase
      .from("profissional_servicos")
      .select("profissional_id, servico_id, profissionais!inner(estabelecimento_id)")
      .eq("profissionais.estabelecimento_id", estabelecimento.id),
    supabase.from("assinatura_horarios_fixos").select("*").eq("estabelecimento_id", estabelecimento.id),
    supabase.from("planos_estabelecimento").select("id, nome, preco_centavos, regras").eq("estabelecimento_id", estabelecimento.id).eq("ativo", true).order("preco_centavos"),
    supabase.from("profissionais").select("id").eq("estabelecimento_id", estabelecimento.id).eq("usuario_id", userId).maybeSingle(),
  ]);

  const meuProfissionalId = meuProfissional?.id ?? null;
  const podeConfigurarHorarioFixo = papel === "owner" || meuProfissionalId !== null;

  const nomeServico = (id: string) => servicos?.find((s) => s.id === id)?.nome ?? "Serviço removido";

  const detalhados: AssinaturaDetalhada[] = (assinaturas ?? []).map((a) => {
    const regras = ((a.planos_estabelecimento?.regras as Regra[] | null) ?? []).map((r) => ({
      servicoId: r.servico_id,
      servicoNome: nomeServico(r.servico_id),
      quantidadeMes: r.quantidade_mes,
    }));
    const horariosDaAssinatura = (horariosFixos ?? [])
      .filter((h) => h.assinatura_cliente_id === a.id && h.ativo)
      .map((h) => ({
        id: h.id,
        servicoId: h.servico_id,
        profissionalId: h.profissional_id,
        tipoRecorrencia: h.tipo_recorrencia as "intervalo" | "mensal",
        intervaloDias: h.intervalo_dias,
        diaSemana: h.dia_semana,
        ordinalSemana: h.ordinal_semana,
        horario: h.horario,
        proximaData: h.proxima_data,
        reservarAutomaticamente: h.reservar_automaticamente,
        ativo: h.ativo,
      }));
    return {
      id: a.id,
      status: a.status,
      cicloInicio: a.ciclo_inicio,
      cicloFim: a.ciclo_fim,
      usosCiclo: (a.usos_ciclo as Record<string, number> | null) ?? {},
      clienteNome: a.clientes?.nome ?? "—",
      clienteTelefone: a.clientes?.telefone ?? "—",
      clienteEmail: a.clientes?.email ?? "",
      planoNome: a.planos_estabelecimento?.nome ?? "Plano removido",
      planoPrecoCentavos: a.planos_estabelecimento?.preco_centavos ?? 0,
      servicosCobertos: regras,
      horariosFixos: horariosDaAssinatura,
    };
  });

  const profissionaisPorServico = new Map<string, { id: string; nome: string }[]>();
  for (const ps of profissionalServicos ?? []) {
    const prof = profissionais?.find((p) => p.id === ps.profissional_id);
    if (!prof) continue;
    // Staff só configura horário fixo na própria agenda -- dono continua vendo todo mundo.
    if (papel !== "owner" && prof.id !== meuProfissionalId) continue;
    const lista = profissionaisPorServico.get(ps.servico_id) ?? [];
    lista.push(prof);
    profissionaisPorServico.set(ps.servico_id, lista);
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading>Assinaturas</Heading>
      {detalhados.length === 0 ? (
        <EmptyState
          icon={Repeat}
          titulo="Nenhuma assinatura ainda"
          descricao="Assinantes aparecem aqui conforme assinam pela página pública, ou cadastre um cliente VIP diretamente abaixo. Configure planos em Configurações → Clube de assinatura."
        />
      ) : (
        <AssinaturasClient
          assinaturas={detalhados}
          podeCancelar={papel === "owner"}
          podeConfigurarHorarioFixo={podeConfigurarHorarioFixo}
          meuProfissionalId={meuProfissionalId}
          profissionaisPorServico={Object.fromEntries(profissionaisPorServico)}
        />
      )}
      {(planosAtivos?.length ?? 0) > 0 && (
        <CadastroVipSection
          planos={(planosAtivos ?? []).map((p) => ({
            id: p.id,
            nome: p.nome,
            precoCentavos: p.preco_centavos,
            servicosCobertos: ((p.regras as Regra[] | null) ?? []).map((r) => ({
              servicoId: r.servico_id,
              servicoNome: nomeServico(r.servico_id),
              quantidadeMes: r.quantidade_mes,
            })),
          }))}
          podeConfigurarHorarioFixo={podeConfigurarHorarioFixo}
          profissionaisPorServico={Object.fromEntries(profissionaisPorServico)}
        />
      )}
    </div>
  );
}
