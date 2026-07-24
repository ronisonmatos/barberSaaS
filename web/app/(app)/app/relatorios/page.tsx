import { redirect } from "next/navigation";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

export default async function RelatoriosIndexPage() {
  const { papel } = await getEstabelecimentoAtivo();
  redirect(papel === "owner" ? "/app/relatorios/financeiro" : "/app/relatorios/agendamentos");
}
