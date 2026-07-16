import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MeuAgendamentoLink } from "./meu-agendamento-link";

export default async function EstabelecimentoPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!estabelecimento) notFound();

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase
      .from("servicos")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("profissionais")
      .select("*")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl text-tenant-fg">{estabelecimento.nome}</h1>
        {estabelecimento.descricao && (
          <p className="mt-1 text-tenant-fg opacity-70">{estabelecimento.descricao}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/b/${slug}/agendar`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-tenant-acento px-4 font-medium text-tenant-acento-fg transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2"
        >
          Agendar horário
        </Link>
        <MeuAgendamentoLink slug={slug} />
      </div>

      <section>
        <Eyebrow>Serviços</Eyebrow>
        <ul className="mt-3 flex flex-col gap-2">
          {(servicos ?? []).map((s) => (
            <li
              key={s.id}
              className="flex justify-between rounded-md border border-tenant-linha bg-tenant-bg-2 p-3"
            >
              <div>
                <p className="font-medium text-tenant-fg">{s.nome}</p>
                <p className="text-sm text-tenant-fg opacity-70">{s.duracao_minutos}min</p>
              </div>
              <p className="font-medium tabular-nums text-tenant-fg">{centavosToBRL(s.preco_centavos)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Eyebrow>Profissionais</Eyebrow>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(profissionais ?? []).map((p) => (
            <li
              key={p.id}
              className="rounded-full border border-tenant-linha px-3 py-1 text-sm text-tenant-fg"
            >
              {p.nome}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
