import Link from "next/link";
import { centavosToBRL } from "@/lib/money";
import { MeuAgendamentoLink } from "./meu-agendamento-link";
import { AtelierReveal } from "./atelier-reveal";
import { BOTAO_PRIMARIO, BOTAO_GHOST, ROTULO_SECAO, CONTAINER, SECAO } from "./estilos-atelier";
import { formatarEndereco, linkWhatsApp } from "./home-helpers";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Foto = { id: string; url: string };
type Produto = { id: string; nome: string; preco_centavos: number; foto_url: string | null; slug: string };
type Plano = {
  id: string;
  nome: string;
  preco_centavos: number;
  regras: { servicoNome: string; quantidadeMes: number }[];
};
export type RitualPasso = { titulo: string; texto: string };

// Ver comentário na faixa de serviços (marquee) mais abaixo — precisa bater com a % do keyframe
// "atelier-marquee" em globals.css.
const MARQUEE_REPETICOES = 8;

export function HomeAtelier({
  slug,
  estabelecimento,
  servicos,
  profissionais,
  fotos,
  produtos,
  planos,
  ritual,
}: {
  slug: string;
  estabelecimento: Estabelecimento;
  servicos: Servico[];
  profissionais: Profissional[];
  fotos: Foto[];
  produtos: Produto[];
  planos: Plano[];
  ritual: RitualPasso[];
}) {
  const endereco = formatarEndereco(estabelecimento.endereco);
  const whatsapp = linkWhatsApp(estabelecimento.telefone_whatsapp);
  const fotoHero = fotos[0] ?? null;
  const inicial = estabelecimento.nome.slice(0, 1).toUpperCase();

  const NAV = [
    ritual.length > 0 ? { href: "#ritual", label: "O ritual" } : null,
    servicos.length > 0 ? { href: "#servicos", label: "Serviços" } : null,
    profissionais.length > 0 ? { href: "#equipe", label: "Equipe" } : null,
    produtos.length > 0 ? { href: "#produtos", label: "Produtos" } : null,
    estabelecimento.sobre ? { href: "#sobre", label: "Sobre" } : null,
  ].filter((n): n is { href: string; label: string } => n !== null);

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-tenant-linha bg-tenant-bg/85 backdrop-blur">
        <div className={`${CONTAINER} flex h-[4.5rem] items-center justify-between gap-4`}>
          <div className="flex min-w-0 items-center gap-2.5">
            {estabelecimento.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
              <img
                src={estabelecimento.logo_url}
                alt={estabelecimento.nome}
                className="size-8 shrink-0 rounded-full border border-tenant-linha object-cover"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-tenant-acento font-display text-sm text-tenant-acento">
                {inicial}
              </span>
            )}
            <p className="truncate font-display text-lg">{estabelecimento.nome}</p>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-tenant-fg/75 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors duration-150 hover:text-tenant-fg">
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
      <section className={`${CONTAINER} grid grid-cols-1 items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14`}>
        <AtelierReveal>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-10 bg-tenant-acento" />
            <p className={ROTULO_SECAO}>{estabelecimento.nome}</p>
          </div>
          <h1 className="font-display text-[2.75rem] leading-[0.98] sm:text-6xl">
            {estabelecimento.descricao ? estabelecimento.descricao : `Bem-vindo à ${estabelecimento.nome}`}
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/b/${slug}/agendar`} className={BOTAO_PRIMARIO}>
              Agendar horário
            </Link>
            <MeuAgendamentoLink slug={slug} />
          </div>
        </AtelierReveal>

        <AtelierReveal className="[transition-delay:150ms]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-tenant-linha bg-tenant-bg-2">
            {fotoHero ? (
              /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
              <img src={fotoHero.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-8xl text-tenant-acento/90">{inicial}</span>
              </div>
            )}
            {(estabelecimento.horario_texto || endereco) && (
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.08em] text-tenant-fg">
                <span className="truncate rounded-sm bg-tenant-bg/85 px-2 py-1 backdrop-blur">
                  {endereco ? endereco.split("\n")[0] : estabelecimento.nome}
                </span>
                {estabelecimento.horario_texto && (
                  <span className="shrink-0 rounded-sm bg-tenant-bg/85 px-2 py-1 backdrop-blur">
                    {estabelecimento.horario_texto.split(/[,\n]/)[0]}
                  </span>
                )}
              </div>
            )}
          </div>
        </AtelierReveal>
      </section>

      {/* Marquee de serviços — repete a lista MARQUEE_REPETICOES vezes e anima
          translateX(-100%/MARQUEE_REPETICOES) pra dar a impressão de loop infinito.
          - Espaçamento em margin-right por item (não gap no container): com gap, um container de
            N*REPETICOES itens tem só N*REPETICOES-1 "buracos" (número ímpar), então a fração exata
            do loop nunca cai certo — sobra um respiro visível antes de reiniciar. Com margin em
            cada item, todas as cópias têm exatamente a mesma largura, e o corte é sempre perfeito.
          - REPETICOES > 2 existe pra cobrir estabelecimentos com poucos serviços (nomes curtos):
            só 2 cópias podem ficar mais estreitas que a tela em monitores largos, deixando um
            vazio depois que as 2 cópias passam e antes do loop reiniciar. Se mudar esse número,
            mudar também a % do keyframe "atelier-marquee" em globals.css (-100/REPETICOES). */}
      {servicos.length > 0 && (
        <div className="overflow-hidden border-y border-tenant-linha bg-tenant-bg-2 py-3.5">
          <div className="atelier-marquee-track flex w-max items-center">
            {Array.from({ length: MARQUEE_REPETICOES }, () => servicos)
              .flat()
              .map((s, i) => (
                <span
                  key={i}
                  className="mr-10 flex shrink-0 items-center gap-3 whitespace-nowrap font-display text-lg text-tenant-fg/70"
                >
                  {s.nome}
                  <span className="text-xs text-tenant-acento">◆</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* O Ritual — parâmetro específico do Atelier */}
      {ritual.length > 0 && (
        <section id="ritual" className={`${CONTAINER} ${SECAO}`}>
          <AtelierReveal>
            <p className={`${ROTULO_SECAO} mb-2`}>O ritual</p>
            <h2 className="mb-10 font-display text-3xl">
              {ritual.length === 1 ? "Como cuidamos de você" : `${ritual.length} passos, um resultado`}
            </h2>
          </AtelierReveal>
          <AtelierReveal stagger className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {ritual.map((passo, i) => (
              <div
                key={i}
                className={`pb-6 lg:pb-0 lg:pr-7 ${
                  i < ritual.length - 1 ? "border-b border-tenant-linha lg:border-b-0 lg:border-r" : ""
                } ${i > 0 ? "lg:pl-7" : ""}`}
              >
                <p className="mb-3 font-display text-4xl tabular-nums text-tenant-acento">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mb-1.5 text-[1.05rem] font-semibold">{passo.titulo}</p>
                <p className="text-sm text-tenant-fg/70">{passo.texto}</p>
              </div>
            ))}
          </AtelierReveal>
        </section>
      )}

      {/* Serviços — cardápio */}
      {servicos.length > 0 && (
        <section id="servicos" className={`${CONTAINER} ${SECAO}`}>
          <AtelierReveal>
            <p className={`${ROTULO_SECAO} mb-2`}>Serviços</p>
            <h2 className="mb-10 font-display text-3xl">O que fazemos</h2>
          </AtelierReveal>
          <AtelierReveal stagger className="flex flex-col">
            {servicos.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-baseline gap-3 py-5 transition-[padding] duration-300 hover:pl-2 ${
                  i === 0 ? "border-y border-tenant-linha" : "border-b border-tenant-linha"
                }`}
              >
                <span className="shrink-0 font-display text-xl">{s.nome}</span>
                <span className="shrink-0 text-xs text-tenant-fg/60">{s.duracao_minutos} min</span>
                <span className="mb-1 h-px flex-1 border-b border-dotted border-tenant-linha" />
                <span className="shrink-0 font-display text-lg tabular-nums text-tenant-acento">
                  {centavosToBRL(s.preco_centavos)}
                </span>
              </div>
            ))}
          </AtelierReveal>
        </section>
      )}

      {profissionais.length > 0 && (
        <section id="equipe" className={`${CONTAINER} ${SECAO}`}>
          <AtelierReveal>
            <p className={`${ROTULO_SECAO} mb-2`}>Equipe</p>
            <h2 className="mb-10 font-display text-3xl">Quem cuida de você</h2>
          </AtelierReveal>
          <AtelierReveal stagger className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {profissionais.map((p) => (
              <div key={p.id} className="text-center">
                <div className="group mb-3 aspect-[3/4] overflow-hidden rounded-sm border border-tenant-linha bg-tenant-bg-2">
                  {p.foto_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                    <img
                      src={p.foto_url}
                      alt=""
                      className="h-full w-full object-cover grayscale transition-all duration-500 hover:scale-105 hover:grayscale-0"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-4xl text-tenant-fg/50">
                      {p.nome.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold">{p.nome}</p>
              </div>
            ))}
          </AtelierReveal>
        </section>
      )}

      {produtos.length > 0 && (
        <section id="produtos" className={`${CONTAINER} ${SECAO}`}>
          <AtelierReveal className="mb-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`${ROTULO_SECAO} mb-2`}>Loja</p>
              <h2 className="font-display text-3xl">Pra levar pra casa</h2>
            </div>
            <Link href={`/b/${slug}/loja`} className={BOTAO_GHOST}>
              Ver loja completa
            </Link>
          </AtelierReveal>
          <AtelierReveal stagger className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {produtos.map((p) => (
              <Link
                key={p.id}
                href={`/b/${slug}/loja/${p.slug}`}
                className="group flex flex-col gap-2 rounded-sm border border-tenant-linha bg-tenant-bg-2 p-3 transition-transform duration-300 hover:-translate-y-1"
              >
                {p.foto_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                  <img src={p.foto_url} alt="" className="aspect-square w-full rounded-sm object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-sm bg-gradient-to-br from-tenant-acento/15 to-transparent text-xs text-tenant-fg/50">
                    Produto
                  </div>
                )}
                <p className="truncate text-sm font-medium">{p.nome}</p>
                <p className="text-sm tabular-nums text-tenant-acento">{centavosToBRL(p.preco_centavos)}</p>
              </Link>
            ))}
          </AtelierReveal>
        </section>
      )}

      {planos.length > 0 && (
        <section id="clube" className={`${CONTAINER} ${SECAO}`}>
          <AtelierReveal className="mb-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`${ROTULO_SECAO} mb-2`}>Recorrência</p>
              <h2 className="font-display text-3xl">Clube de assinatura</h2>
            </div>
            <Link href={`/b/${slug}/clube`} className={BOTAO_GHOST}>
              Ver planos
            </Link>
          </AtelierReveal>
          <AtelierReveal stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {planos.map((p) => (
              <div key={p.id} className="rounded-sm border border-tenant-linha bg-tenant-bg-2 p-5">
                <p className="font-display text-lg">{p.nome}</p>
                <p className="mt-2 font-display text-xl tabular-nums text-tenant-acento">
                  {centavosToBRL(p.preco_centavos)}/mês
                </p>
                {p.regras.length > 0 && (
                  <p className="mt-2 text-sm text-tenant-fg/70">
                    {p.regras.map((r) => `${r.quantidadeMes}x ${r.servicoNome}`).join(", ")} por mês
                  </p>
                )}
              </div>
            ))}
          </AtelierReveal>
        </section>
      )}

      {(estabelecimento.sobre || estabelecimento.horario_texto || endereco) && (
        <section id="sobre" className={`${CONTAINER} ${SECAO}`}>
          <AtelierReveal className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            {estabelecimento.sobre && (
              <div>
                <p className={`${ROTULO_SECAO} mb-4`}>Sobre</p>
                <p className="font-display text-2xl leading-snug text-balance before:text-tenant-acento before:content-['“'] after:text-tenant-acento after:content-['”']">
                  {estabelecimento.sobre}
                </p>
              </div>
            )}
            {(estabelecimento.horario_texto || endereco) && (
              <div className="flex flex-col gap-3">
                {estabelecimento.horario_texto && (
                  <div className="rounded-sm border border-tenant-linha bg-tenant-bg-2 p-4">
                    <p className={`${ROTULO_SECAO} mb-1.5`}>Horário</p>
                    <p className="whitespace-pre-line text-sm text-tenant-fg/80">{estabelecimento.horario_texto}</p>
                  </div>
                )}
                {endereco && (
                  <div className="rounded-sm border border-tenant-linha bg-tenant-bg-2 p-4">
                    <p className={`${ROTULO_SECAO} mb-1.5`}>Endereço</p>
                    <p className="whitespace-pre-line text-sm text-tenant-fg/80">{endereco}</p>
                  </div>
                )}
              </div>
            )}
          </AtelierReveal>

          <AtelierReveal className="mt-12 flex flex-col items-center justify-between gap-5 rounded-sm border border-tenant-linha bg-gradient-to-br from-tenant-acento/10 to-transparent p-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className={`${ROTULO_SECAO} mb-1.5`}>Pronto pra renovar?</p>
              <p className="font-display text-xl">Reserve seu horário em menos de um minuto.</p>
            </div>
            <Link href={`/b/${slug}/agendar`} className={BOTAO_PRIMARIO}>
              Agendar agora
            </Link>
          </AtelierReveal>
        </section>
      )}

      {(whatsapp || estabelecimento.instagram_url) && (
        <footer className={`${CONTAINER} flex flex-wrap items-center justify-between gap-4 border-t border-tenant-linha py-8`}>
          <p className="text-xs text-tenant-fg/60">{estabelecimento.nome}</p>
          <div className="flex gap-5 text-sm">
            {estabelecimento.instagram_url && (
              <a
                href={estabelecimento.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-tenant-linha underline-offset-4 transition-colors hover:decoration-tenant-acento"
              >
                Instagram
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-tenant-linha underline-offset-4 transition-colors hover:decoration-tenant-acento"
              >
                WhatsApp
              </a>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
