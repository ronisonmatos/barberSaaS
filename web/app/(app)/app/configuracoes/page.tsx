import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { PerfilForm } from "./perfil-form";
import { PagamentoForm } from "./pagamento-form";
import { EquipeForm } from "./equipe-form";
import { GaleriaForm } from "./galeria-form";

const LIMITE_USUARIOS_SEM_PLANO = 1;
const LIMITE_FOTOS_SEM_PLANO = 5;

function mascarar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.length <= 4) return "••••";
  return `••••${valor.slice(-4)}`;
}

type Gateway = "nenhum" | "mercado_pago" | "asaas";

function gatewayValido(valor: string | undefined): Gateway {
  return valor === "mercado_pago" || valor === "asaas" ? valor : "nenhum";
}

type Endereco = {
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
};

function parseEndereco(valor: unknown): Endereco | null {
  if (!valor || typeof valor !== "object") return null;
  return valor as Endereco;
}

export default async function ConfiguracoesPage() {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: pagamentoConfig } =
    papel === "owner"
      ? await supabase
          .from("estabelecimento_pagamento_config")
          .select("*")
          .eq("estabelecimento_id", estabelecimento.id)
          .maybeSingle()
      : { data: null };

  let membros: { id: string; nome: string; papel: "owner" | "staff"; usuarioId: string }[] = [];
  let limiteUsuarios: number | null = null;
  if (papel === "owner") {
    const [{ data: membrosData }, { data: plano }] = await Promise.all([
      supabase
        .from("membros_estabelecimento")
        .select("id, papel, usuario_id, usuarios(nome)")
        .eq("estabelecimento_id", estabelecimento.id)
        .order("papel"),
      estabelecimento.plano_plataforma_id
        ? supabase
            .from("planos_plataforma")
            .select("max_usuarios")
            .eq("id", estabelecimento.plano_plataforma_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);
    membros = (membrosData ?? []).map((m) => ({
      id: m.id,
      nome: m.usuarios?.nome ?? "—",
      papel: m.papel,
      usuarioId: m.usuario_id,
    }));
    limiteUsuarios = estabelecimento.plano_plataforma_id
      ? (plano?.max_usuarios ?? null)
      : LIMITE_USUARIOS_SEM_PLANO;
  }

  const [{ data: fotos }, { data: planoFotos }] = await Promise.all([
    supabase
      .from("estabelecimento_fotos")
      .select("id, url")
      .eq("estabelecimento_id", estabelecimento.id)
      .order("ordem"),
    estabelecimento.plano_plataforma_id
      ? supabase
          .from("planos_plataforma")
          .select("max_fotos")
          .eq("id", estabelecimento.plano_plataforma_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const limiteFotos = estabelecimento.plano_plataforma_id
    ? (planoFotos?.max_fotos ?? null)
    : LIMITE_FOTOS_SEM_PLANO;

  return (
    <div className="flex flex-col gap-6">
      <Heading>Configurações</Heading>

      <Card className="p-4">
        <Heading as="h2" className="mb-4">
          Perfil
        </Heading>
        <PerfilForm
          nomeAtual={estabelecimento.nome}
          logoUrl={estabelecimento.logo_url}
          descricaoAtual={estabelecimento.descricao}
          sobreAtual={estabelecimento.sobre}
          horarioTextoAtual={estabelecimento.horario_texto}
          instagramUrlAtual={estabelecimento.instagram_url}
          enderecoAtual={parseEndereco(estabelecimento.endereco)}
        />
      </Card>

      <Card className="p-4">
        <Heading as="h2" className="mb-4">
          Fotos do estabelecimento
        </Heading>
        <GaleriaForm fotos={fotos ?? []} limite={limiteFotos} />
      </Card>

      {papel === "owner" && (
        <Card className="p-4">
          <Heading as="h2" className="mb-4">
            Pagamentos
          </Heading>
          <PagamentoForm
            gatewayAtivo={gatewayValido(pagamentoConfig?.gateway_ativo)}
            aceitaPagamentoAntecipado={pagamentoConfig?.aceita_pagamento_antecipado ?? false}
            aceitaPagamentoNoDia={pagamentoConfig?.aceita_pagamento_no_dia ?? true}
            mercadoPagoTokenMascarado={mascarar(pagamentoConfig?.mercado_pago_access_token)}
            mercadoPagoPublicKey={pagamentoConfig?.mercado_pago_public_key ?? null}
            mercadoPagoWebhookSecretMascarado={mascarar(pagamentoConfig?.mercado_pago_webhook_secret)}
            asaasChaveMascarada={mascarar(pagamentoConfig?.asaas_api_key)}
            urlWebhook={`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`}
          />
        </Card>
      )}

      {papel === "owner" && (
        <Card className="p-4">
          <Heading as="h2" className="mb-4">
            Equipe
          </Heading>
          <EquipeForm membros={membros} limite={limiteUsuarios} meuUsuarioId={userId} />
        </Card>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <Heading as="h2">Suporte</Heading>
          <p className="text-sm text-cinza-600">Precisa de ajuda? Veja ou abra um chamado.</p>
        </div>
        <Link href="/app/suporte">
          <Button variant="secondary">Ver meus chamados</Button>
        </Link>
      </Card>
    </div>
  );
}
