import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { SECOES_CONFIGURACAO } from "./secoes";

export default async function ConfiguracoesPage() {
  const { papel } = await getEstabelecimentoAtivo();
  const secoes = SECOES_CONFIGURACAO.filter((s) => !s.ownerOnly || papel === "owner");

  return (
    <div className="flex flex-col gap-4">
      <Heading>Configurações</Heading>
      <div className="flex flex-col gap-2">
        {secoes.map((secao) => (
          <Link key={secao.href} href={secao.href}>
            <Card className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-marfim">
              <secao.icon className="h-5 w-5 shrink-0 text-latao-escuro" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-carvao">{secao.label}</p>
                <p className="text-sm text-cinza-600">{secao.descricao}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-cinza-300" strokeWidth={1.5} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
