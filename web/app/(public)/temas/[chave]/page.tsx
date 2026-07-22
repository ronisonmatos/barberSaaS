import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePrestigio } from "../../b/[slug]/home-prestigio";
import { HomeAtelier } from "../../b/[slug]/home-atelier";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];

const NOMES_TEMAS: Record<string, string> = {
  prestigio: "Prestígio",
  atelier: "Atelier",
};

const RITUAL_DEMO = [
  { titulo: "Recepção", texto: "Café ou chá enquanto você escolhe o estilo com a gente, sem pressa." },
  { titulo: "Diagnóstico", texto: "Conversamos sobre o corte ideal pro seu rosto, cabelo e rotina." },
  { titulo: "Execução", texto: "Técnica clássica com navalha, tesoura e máquina, no seu ritmo." },
  { titulo: "Finalização", texto: "Toalha quente e produtos premium pra fechar com estilo de verdade." },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chave: string }>;
}): Promise<Metadata> {
  const { chave } = await params;
  const nome = NOMES_TEMAS[chave];
  if (!nome) return {};
  return { title: `Demonstração — Template ${nome} — Comptus` };
}

// Dados ficticios so pra essa demonstracao -- nao existe estabelecimento nenhum por tras.
const ESTABELECIMENTO_DEMO: Estabelecimento = {
  id: "00000000-0000-0000-0000-000000000000",
  nome: "Barbearia Exemplo",
  slug: "demo",
  descricao: "Cortes clássicos e modernos, num ambiente feito pra você relaxar.",
  sobre:
    "Fundada em 2018, nossa barbearia une técnica tradicional e tendências atuais. Cada atendimento é pensado pra você sair renovado.",
  logo_url: null,
  endereco: { rua: "Rua Exemplo", numero: "123", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01000-000" },
  horario_texto: "Seg–Sáb, 09h–19h",
  instagram_url: "https://instagram.com",
  telefone_whatsapp: "+5511999999999",
  timezone: "America/Sao_Paulo",
  status: "ativa",
  trial_ate: null,
  plano_plataforma_id: null,
  ativacao_manual: false,
  asaas_customer_id: null,
  asaas_subconta_id: null,
  cnpj: null,
  config: {},
  rascunho: false,
  rascunho_expira_em: null,
  created_at: new Date().toISOString(),
};

const SERVICOS_DEMO: Servico[] = [
  { id: "s1", estabelecimento_id: "0", nome: "Corte masculino", descricao: null, categoria: null, duracao_minutos: 30, preco_centavos: 4500, ativo: true, created_at: "" },
  { id: "s2", estabelecimento_id: "0", nome: "Barba", descricao: null, categoria: null, duracao_minutos: 20, preco_centavos: 3000, ativo: true, created_at: "" },
  { id: "s3", estabelecimento_id: "0", nome: "Corte + Barba", descricao: null, categoria: null, duracao_minutos: 50, preco_centavos: 7000, ativo: true, created_at: "" },
];

const PROFISSIONAIS_DEMO: Profissional[] = [
  { id: "p1", estabelecimento_id: "0", nome: "Jonas Ferreira", foto_url: null, comissao_percentual: 0, ativo: true, desativado_por_limite_plano: false, usuario_id: null, created_at: "" },
  { id: "p2", estabelecimento_id: "0", nome: "Marina Alves", foto_url: null, comissao_percentual: 0, ativo: true, desativado_por_limite_plano: false, usuario_id: null, created_at: "" },
];

const PRODUTOS_DEMO = [
  { id: "pr1", nome: "Pomada modeladora", preco_centavos: 3500, foto_url: null, slug: "pomada" },
  { id: "pr2", nome: "Óleo para barba", preco_centavos: 2800, foto_url: null, slug: "oleo-barba" },
];

export default async function TemaDemoPage({ params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  if (chave !== "prestigio" && chave !== "atelier") notFound();

  return (
    <div data-tema="classica" className="min-h-screen bg-tenant-bg text-tenant-fg">
      <div className="border-b border-tenant-linha bg-tenant-acento px-4 py-2 text-center text-sm font-medium text-tenant-acento-fg">
        Demonstração do template — dados fictícios, nenhum estabelecimento real por trás.
      </div>
      {chave === "atelier" ? (
        <HomeAtelier
          slug="demo"
          estabelecimento={ESTABELECIMENTO_DEMO}
          servicos={SERVICOS_DEMO}
          profissionais={PROFISSIONAIS_DEMO}
          fotos={[]}
          produtos={PRODUTOS_DEMO}
          planos={[]}
          ritual={RITUAL_DEMO}
        />
      ) : (
        <HomePrestigio
          slug="demo"
          estabelecimento={ESTABELECIMENTO_DEMO}
          servicos={SERVICOS_DEMO}
          profissionais={PROFISSIONAIS_DEMO}
          fotos={[]}
          produtos={PRODUTOS_DEMO}
          planos={[]}
        />
      )}
    </div>
  );
}
