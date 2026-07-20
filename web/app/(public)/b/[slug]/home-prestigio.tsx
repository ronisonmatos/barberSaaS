import Link from "next/link";
import { centavosToBRL } from "@/lib/money";
import { MeuAgendamentoLink } from "./meu-agendamento-link";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, BOTAO_GHOST, ROTULO_SECAO, CONTAINER_LARGO, SECAO } from "./estilos-prestigio";
import { formatarEndereco, linkWhatsApp } from "./home-helpers";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Foto = { id: string; url: string };
type Produto = { id: string; nome: string; preco_centavos: number; foto_url: string | null; slug: string };
type Plano = { id: string; nome: string; preco_centavos: number };

export function HomePrestigio({
  slug,
  estabelecimento,
  servicos,
  profissionais,
  fotos,
  produtos,
  planos,
}: {
  slug: string;
  estabelecimento: Estabelecimento;
  servicos: Servico[];
  profissionais: Profissional[];
  fotos: Foto[];
  produtos: Produto[];
  planos: Plano[];
}) {
  const endereco = formatarEndereco(estabelecimento.endereco);
  const whatsapp = linkWhatsApp(estabelecimento.telefone_whatsapp);
  // Sem corte fixo aqui: quantas fotos existem já é limitado no cadastro pelo max_fotos do plano
  // (ver estabelecimento_fotos/aplicar_limites_plano), não faz sentido duplicar o limite no template.
  const fotosGaleria = fotos;

  const NAV = [
    servicos.length > 0 ? { href: "#servicos", label: "Serviços" } : null,
    produtos.length > 0 ? { href: "#produtos", label: "Produtos" } : null,
    planos.length > 0 ? { href: "#clube", label: "Clube" } : null,
    profissionais.length > 0 ? { href: "#profissionais", label: "Profissionais" } : null,
    estabelecimento.sobre ? { href: "#sobre", label: "Sobre" } : null,
  ].filter((n): n is { href: string; label: string } => n !== null);

  return (
    <div>
      {/* Cabeçalho fixo — diferente do clássico (cartão único), aqui é "site de verdade" */}
      <header className="sticky top-0 z-30 border-b border-tenant-linha bg-tenant-bg-2/95 backdrop-blur">
        <div className={`${CONTAINER_LARGO} flex h-16 items-center justify-between gap-4`}>
          <div className="flex min-w-0 items-center gap-2.5">
            {estabelecimento.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
              <img
                src={estabelecimento.logo_url}
                alt={estabelecimento.nome}
                className="size-9 shrink-0 rounded-full border border-tenant-linha object-cover"
              />
            ) : null}
            <p className="truncate font-semibold">{estabelecimento.nome}</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm opacity-80 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:opacity-100 hover:underline">
                {n.label}
              </a>
            ))}
          </nav>
          <Link href={`/b/${slug}/agendar`} className={`${BOTAO_PRIMARIO} shrink-0`}>
            Agendar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className={`${CONTAINER_LARGO} grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-2`}>
        <div className="flex flex-col items-start gap-4">
          <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl">{estabelecimento.nome}</h1>
          {estabelecimento.descricao && <p className="max-w-md text-lg opacity-80">{estabelecimento.descricao}</p>}
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href={`/b/${slug}/agendar`} className={BOTAO_PRIMARIO}>
              Agendar horário
            </Link>
            <MeuAgendamentoLink slug={slug} />
          </div>
        </div>

        {fotosGaleria.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {fotosGaleria.map((f, i) => (
              /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
              <img
                key={f.id}
                src={f.url}
                alt=""
                className={`aspect-square w-full rounded-2xl object-cover ${i === 0 ? "col-span-2 aspect-[2/1]" : ""}`}
              />
            ))}
          </div>
        ) : (
          estabelecimento.logo_url && (
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */}
              <img
                src={estabelecimento.logo_url}
                alt={estabelecimento.nome}
                className="aspect-square w-full max-w-xs rounded-2xl border border-tenant-linha object-cover"
              />
            </div>
          )
        )}
      </section>

      {servicos.length > 0 && (
        <section id="servicos" className={`${CONTAINER_LARGO} ${SECAO} border-t border-tenant-linha`}>
          <p className={`${ROTULO_SECAO} mb-2`}>Serviços</p>
          <h2 className="mb-8 font-display text-2xl">O que fazemos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicos.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-2xl border border-tenant-linha bg-tenant-bg-2 p-5">
                <p className="text-lg font-semibold">{s.nome}</p>
                <p className="text-sm opacity-60">{s.duracao_minutos} min</p>
                <p className="mt-2 text-xl font-bold tabular-nums text-tenant-acento">
                  {centavosToBRL(s.preco_centavos)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {produtos.length > 0 && (
        <section id="produtos" className={`${CONTAINER_LARGO} ${SECAO} border-t border-tenant-linha`}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className={`${ROTULO_SECAO} mb-2`}>Novidades</p>
              <h2 className="font-display text-2xl">Produtos</h2>
            </div>
            <Link href={`/b/${slug}/loja`} className={BOTAO_GHOST}>
              Ver loja completa
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {produtos.map((p) => (
              <Link
                key={p.id}
                href={`/b/${slug}/loja/${p.slug}`}
                className="flex flex-col gap-2 rounded-2xl border border-tenant-linha bg-tenant-bg-2 p-3 transition-opacity duration-150 hover:opacity-85"
              >
                {p.foto_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                  <img src={p.foto_url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-tenant-linha text-xs opacity-60">
                    Produto
                  </div>
                )}
                <p className="truncate text-sm font-medium">{p.nome}</p>
                <p className="text-sm font-semibold tabular-nums text-tenant-acento">{centavosToBRL(p.preco_centavos)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {planos.length > 0 && (
        <section id="clube" className={`${CONTAINER_LARGO} ${SECAO} border-t border-tenant-linha`}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className={`${ROTULO_SECAO} mb-2`}>Recorrência</p>
              <h2 className="font-display text-2xl">Clube de assinatura</h2>
            </div>
            <Link href={`/b/${slug}/clube`} className={BOTAO_GHOST}>
              Ver planos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planos.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-tenant-linha bg-tenant-bg-2 p-5">
                <p className="text-lg font-semibold">{p.nome}</p>
                <p className="mt-2 text-xl font-bold tabular-nums text-tenant-acento">
                  {centavosToBRL(p.preco_centavos)}/mês
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {profissionais.length > 0 && (
        <section id="profissionais" className={`${CONTAINER_LARGO} ${SECAO} border-t border-tenant-linha`}>
          <p className={`${ROTULO_SECAO} mb-2`}>Equipe</p>
          <h2 className="mb-8 font-display text-2xl">Profissionais</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profissionais.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2 text-center">
                {p.foto_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                  <img src={p.foto_url} alt="" className="size-20 rounded-full border border-tenant-linha object-cover" />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full border border-tenant-linha text-xs opacity-60">
                    {p.nome.slice(0, 1)}
                  </div>
                )}
                <p className="text-sm font-medium">{p.nome}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(estabelecimento.sobre || estabelecimento.horario_texto || endereco) && (
        <section id="sobre" className={`${CONTAINER_LARGO} ${SECAO} grid grid-cols-1 gap-10 border-t border-tenant-linha lg:grid-cols-2`}>
          {estabelecimento.sobre && (
            <div>
              <p className={`${ROTULO_SECAO} mb-2`}>Sobre</p>
              <p className="leading-relaxed opacity-85">{estabelecimento.sobre}</p>
            </div>
          )}
          {(estabelecimento.horario_texto || endereco) && (
            <div className="flex flex-col gap-4">
              {estabelecimento.horario_texto && (
                <div className="rounded-2xl border border-tenant-linha bg-tenant-bg-2 p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] opacity-70">Horário</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{estabelecimento.horario_texto}</p>
                </div>
              )}
              {endereco && (
                <div className="rounded-2xl border border-tenant-linha bg-tenant-bg-2 p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] opacity-70">Endereço</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{endereco}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {(whatsapp || estabelecimento.instagram_url) && (
        <div className={`${CONTAINER_LARGO} flex gap-3 border-t border-tenant-linha py-8`}>
          {estabelecimento.instagram_url && (
            <a href={estabelecimento.instagram_url} target="_blank" rel="noopener noreferrer" className={BOTAO_SECUNDARIO}>
              Instagram
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={BOTAO_SECUNDARIO}>
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
