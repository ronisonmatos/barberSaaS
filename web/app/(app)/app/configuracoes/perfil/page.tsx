import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { PerfilForm } from "../perfil-form";
import { VoltarConfiguracoes } from "../voltar-link";

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

export default async function PerfilConfigPage() {
  const { estabelecimento } = await getEstabelecimentoAtivo();

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Perfil</Heading>
      <Card className="p-4">
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
    </div>
  );
}
