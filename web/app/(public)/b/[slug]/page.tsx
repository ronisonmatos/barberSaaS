import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";

export default async function BarbeariaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: barbearia } = await supabase
    .from("barbearias")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!barbearia) notFound();

  const [{ data: servicos }, { data: profissionais }] = await Promise.all([
    supabase
      .from("servicos")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("profissionais")
      .select("*")
      .eq("barbearia_id", barbearia.id)
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{barbearia.nome}</h1>
        {barbearia.descricao && <p className="text-neutral-600 dark:text-neutral-400">{barbearia.descricao}</p>}
      </div>

      <Link
        href={`/b/${slug}/agendar`}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900"
      >
        Agendar horário
      </Link>

      <section>
        <h2 className="mb-2 text-lg font-medium">Serviços</h2>
        <ul className="flex flex-col gap-2">
          {(servicos ?? []).map((s) => (
            <li key={s.id} className="flex justify-between rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <div>
                <p className="font-medium">{s.nome}</p>
                <p className="text-sm text-neutral-500">{s.duracao_minutos}min</p>
              </div>
              <p className="font-medium">{centavosToBRL(s.preco_centavos)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Profissionais</h2>
        <ul className="flex flex-wrap gap-2">
          {(profissionais ?? []).map((p) => (
            <li key={p.id} className="rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800">
              {p.nome}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
