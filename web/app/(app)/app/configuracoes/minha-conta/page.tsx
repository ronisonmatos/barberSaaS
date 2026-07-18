import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { MinhaContaForm } from "../minha-conta-form";
import { VoltarConfiguracoes } from "../voltar-link";

export default async function MinhaContaConfigPage() {
  const { userId } = await getEstabelecimentoAtivo();
  const supabase = await createClient();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, genero, cpf")
    .eq("id", userId)
    .single();

  return (
    <div className="flex flex-col gap-4">
      <VoltarConfiguracoes />
      <Heading>Minha conta</Heading>
      <Card className="p-4">
        <MinhaContaForm
          nomeAtual={usuario?.nome ?? ""}
          generoAtual={usuario?.genero ?? null}
          cpfAtual={usuario?.cpf ?? null}
        />
      </Card>
    </div>
  );
}
