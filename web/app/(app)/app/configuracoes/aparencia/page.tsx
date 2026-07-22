import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VoltarConfiguracoes } from "../voltar-link";
import { AparenciaForm } from "./aparencia-form";

const PRESETS: Record<string, { bg: string; bg2: string; fg: string; linha: string; acento: string; acentoFg: string }> = {
  classica: { bg: "#17191c", bg2: "#22262a", fg: "#f4f2ed", linha: "#2e3237", acento: "#c9a15c", acentoFg: "#17191c" },
  moderna: { bg: "#f4f2ed", bg2: "#ffffff", fg: "#17191c", linha: "#e5e1d8", acento: "#17191c", acentoFg: "#f4f2ed" },
  delicada: { bg: "#faf7f4", bg2: "#ffffff", fg: "#3a3330", linha: "#ecdfd9", acento: "#b4826e", acentoFg: "#faf7f4" },
  prestigio: { bg: "#1b2a22", bg2: "#2f4a3a", fg: "#f4f2ed", linha: "#3f5347", acento: "#c9a15c", acentoFg: "#17191c" },
  atelier: { bg: "#f2ece1", bg2: "#e4dcc9", fg: "#1b1815", linha: "#d8cdb6", acento: "#7a2e2a", acentoFg: "#f2ece1" },
};

export default async function AparenciaConfigPage() {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();

  if (papel !== "owner") {
    return (
      <div className="flex flex-col gap-4">
        <VoltarConfiguracoes />
        <Heading>Aparência</Heading>
        <Card className="p-4 text-sm text-cinza-600">Somente o dono do estabelecimento acessa essa seção.</Card>
      </div>
    );
  }

  const supabase = await createClient();
  // "prestigio" é a única paleta que continua exclusiva de quem comprou o template correspondente
  // em Configurações → Template (ver [data-tema="prestigio"] em globals.css) -- "atelier" é
  // liberada pra qualquer estabelecimento, decisão explícita do usuário.
  const [{ data: temaPrestigio }, { data: compras }] = await Promise.all([
    supabase.from("temas_plataforma").select("id, chave").eq("chave", "prestigio").maybeSingle(),
    supabase.from("estabelecimento_temas_comprados").select("tema_plataforma_id").eq("estabelecimento_id", estabelecimento.id),
  ]);
  const idsComprados = new Set((compras ?? []).map((c) => c.tema_plataforma_id));
  const temasDesbloqueados = temaPrestigio && idsComprados.has(temaPrestigio.id) ? [temaPrestigio.chave] : [];

  const config = (estabelecimento.config ?? {}) as Record<string, unknown>;
  const tema = typeof config.tema === "string" ? config.tema : "classica";
  const coresIniciais = (config.cores as typeof PRESETS.classica | undefined) ?? PRESETS[tema] ?? PRESETS.classica;

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Aparência</Heading>
      <Card className="p-4">
        <p className="mb-4 text-sm text-cinza-600">
          Personalize as cores da sua página pública (a que os clientes veem em <code>/b/{estabelecimento.slug}</code>).
          Escolha uma paleta pronta ou ajuste cada cor individualmente.
        </p>
        <AparenciaForm coresIniciais={coresIniciais} temasDesbloqueados={temasDesbloqueados} />
      </Card>
    </div>
  );
}
