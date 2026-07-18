import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";
import { listarRecursos, precoVigente } from "@/lib/planos";
import { FaixaPromocional } from "@/components/ui/faixa-promocional";

export async function Planos() {
  const supabase = await createClient();
  const { data: planos } = await supabase
    .from("planos_plataforma")
    .select("*")
    .eq("ativo", true)
    .order("preco_centavos");

  if (!planos || planos.length === 0) return null;

  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <p className="fio mx-auto w-fit text-xs font-medium tracking-[0.14em] text-latao uppercase">
          Planos
        </p>
        <h2 className="mt-4 font-display text-3xl text-marfim">Comece de graça, cresça quando precisar</h2>
        <p className="mt-3 text-marfim/70">Sem cartão de crédito para começar. Cancele quando quiser.</p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano) => {
          const gratis = plano.preco_centavos === 0;
          const valorVigente = precoVigente(plano, null);
          const emPromocao = valorVigente !== plano.preco_centavos;
          return (
            <div
              key={plano.id}
              className={`relative flex flex-col gap-4 rounded-lg border p-6 ${
                gratis ? "border-latao bg-latao/5" : "border-linha-escuro bg-carvao-2"
              }`}
            >
              {emPromocao && <FaixaPromocional texto={plano.promocao_titulo || "Promoção"} />}
              <div>
                <p className="font-display text-xl text-marfim">{plano.nome}</p>
                <p className="mt-1 text-marfim">
                  {emPromocao && (
                    <span className="mr-2 text-base text-marfim/50 line-through">
                      {centavosToBRL(plano.preco_centavos)}
                    </span>
                  )}
                  <span className="text-3xl tabular-nums">{centavosToBRL(valorVigente)}</span>
                  {!gratis && <span className="text-sm text-marfim/60">/mês</span>}
                </p>
                {emPromocao && plano.promocao_duracao_meses && (
                  <p className="mt-1 text-xs text-latao">
                    Por {plano.promocao_duracao_meses} {plano.promocao_duracao_meses === 1 ? "mês" : "meses"},
                    depois {centavosToBRL(plano.preco_centavos)}/mês
                  </p>
                )}
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-marfim/70">
                {listarRecursos(plano).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium ${
                  gratis
                    ? "bg-latao text-carvao hover:bg-latao-escuro"
                    : "border border-linha-escuro text-marfim hover:bg-carvao"
                }`}
              >
                {gratis ? "Criar conta grátis" : "Começar agora"}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
