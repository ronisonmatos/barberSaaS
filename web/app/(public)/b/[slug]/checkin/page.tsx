import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckinForm } from "./checkin-form";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, PAGINA_WRAP, PAGINA_CARTAO } from "../estilos";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("id, nome, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!estabelecimento) notFound();

  return (
    <div className={PAGINA_WRAP}>
      <div className={`${PAGINA_CARTAO} flex flex-col gap-6 p-6`}>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-display text-2xl text-tenant-fg">{estabelecimento.nome}</h1>
          <p className="text-tenant-fg opacity-70">O que você deseja fazer?</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href={`/b/${slug}/agendar`} className={BOTAO_PRIMARIO}>
            Agendar horário
          </Link>
          <CheckinForm estabelecimentoId={estabelecimento.id} botaoAbrirClassName={BOTAO_SECUNDARIO} />
        </div>
      </div>
    </div>
  );
}
