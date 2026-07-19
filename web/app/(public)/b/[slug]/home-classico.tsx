import Link from "next/link";
import { centavosToBRL } from "@/lib/money";
import { MeuAgendamentoLink } from "./meu-agendamento-link";
import { BOTAO_PRIMARIO, BOTAO_GHOST, ROTULO_SECAO, PAGINA_WRAP, PAGINA_CARTAO } from "./estilos";
import { formatarEndereco, linkWhatsApp } from "./home-helpers";
import type { Database } from "@/lib/supabase/types";

type Estabelecimento = Database["public"]["Tables"]["estabelecimentos"]["Row"];
type Servico = Database["public"]["Tables"]["servicos"]["Row"];
type Profissional = Database["public"]["Tables"]["profissionais"]["Row"];
type Foto = { id: string; url: string };
type Produto = { id: string; nome: string; preco_centavos: number; foto_url: string | null; slug: string };
type Plano = { id: string; nome: string; preco_centavos: number };

export function HomeClassico({
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
  const infoCards = [
    estabelecimento.horario_texto ? { titulo: "Horário", conteudo: estabelecimento.horario_texto } : null,
    endereco ? { titulo: "Endereço", conteudo: endereco } : null,
  ].filter((c): c is { titulo: string; conteudo: string } => c !== null);

  return (
    <div className={PAGINA_WRAP}>
      <div className={PAGINA_CARTAO}>
        <div className="flex flex-col items-center gap-3 px-7 pt-10 pb-7 text-center">
          {estabelecimento.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
            <img
              src={estabelecimento.logo_url}
              alt={estabelecimento.nome}
              className="size-[88px] rounded-full border border-tenant-linha object-cover"
            />
          ) : (
            <div className="flex size-[88px] items-center justify-center rounded-full border border-tenant-linha text-xs opacity-60">
              Logo
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{estabelecimento.nome}</h1>
          {estabelecimento.descricao && <p className="text-sm opacity-70">{estabelecimento.descricao}</p>}
          <div className="mt-1 flex flex-wrap justify-center gap-2.5">
            <Link href={`/b/${slug}/agendar`} className={BOTAO_PRIMARIO}>
              Agendar horário
            </Link>
            <MeuAgendamentoLink slug={slug} />
          </div>
        </div>

        {fotos.length > 0 && (
          <div className="px-6 pb-2">
            <p className={`${ROTULO_SECAO} mb-3`}>Fotos do estabelecimento</p>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {fotos.map((f) => (
                /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                <img key={f.id} src={f.url} alt="" className="aspect-square w-full rounded-[10px] object-cover" />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5 px-6 pb-6">
          {estabelecimento.sobre && (
            <section>
              <p className={`${ROTULO_SECAO} mb-2`}>Sobre</p>
              <p className="text-sm leading-relaxed opacity-85">{estabelecimento.sobre}</p>
            </section>
          )}

          {infoCards.length > 0 && (
            <div className="grid grid-cols-2 gap-3.5">
              {infoCards.map((c) => (
                <div key={c.titulo} className="rounded-xl bg-tenant-bg p-3.5">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">{c.titulo}</p>
                  <p className="whitespace-pre-line text-[13px] leading-relaxed">{c.conteudo}</p>
                </div>
              ))}
            </div>
          )}

          <section>
            <p className={`${ROTULO_SECAO} mb-2`}>Serviços</p>
            <ul className="flex flex-col gap-2">
              {servicos.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-tenant-bg p-4">
                  <div>
                    <p className="text-[15px] font-semibold">{s.nome}</p>
                    <p className="mt-0.5 text-[13px] opacity-60">{s.duracao_minutos}min</p>
                  </div>
                  <p className="text-base font-bold tabular-nums">{centavosToBRL(s.preco_centavos)}</p>
                </li>
              ))}
            </ul>
          </section>

          {produtos.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className={ROTULO_SECAO}>Produtos</p>
                <Link href={`/b/${slug}/loja`} className={BOTAO_GHOST}>
                  Ver loja
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {produtos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/b/${slug}/loja/${p.slug}`}
                    className="flex flex-col gap-1 rounded-xl bg-tenant-bg p-2 text-center transition-opacity duration-150 hover:opacity-80"
                  >
                    {p.foto_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                      <img src={p.foto_url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-tenant-linha text-xs opacity-60">
                        Produto
                      </div>
                    )}
                    <p className="truncate text-[12px] font-medium">{p.nome}</p>
                    <p className="text-[12px] tabular-nums opacity-70">{centavosToBRL(p.preco_centavos)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {planos.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className={ROTULO_SECAO}>Clube de assinatura</p>
                <Link href={`/b/${slug}/clube`} className={BOTAO_GHOST}>
                  Ver planos
                </Link>
              </div>
              <ul className="flex flex-col gap-2">
                {planos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl bg-tenant-bg p-4">
                    <p className="text-[15px] font-semibold">{p.nome}</p>
                    <p className="text-base font-bold tabular-nums">{centavosToBRL(p.preco_centavos)}/mês</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <p className={`${ROTULO_SECAO} mb-2`}>Profissionais</p>
            <ul className="flex flex-wrap gap-2">
              {profissionais.map((p) => (
                <li key={p.id} className="rounded-full border border-tenant-linha px-4 py-2 text-sm">
                  {p.nome}
                </li>
              ))}
            </ul>
          </section>

          {(whatsapp || estabelecimento.instagram_url) && (
            <div className="flex gap-2.5 border-t border-tenant-linha pt-2">
              {estabelecimento.instagram_url && (
                <a
                  href={estabelecimento.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-tenant-bg p-2.5 text-center text-sm font-semibold transition-opacity duration-150 hover:opacity-80"
                >
                  Instagram
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-tenant-bg p-2.5 text-center text-sm font-semibold transition-opacity duration-150 hover:opacity-80"
                >
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
