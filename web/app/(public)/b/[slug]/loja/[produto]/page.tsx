import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centavosToBRL } from "@/lib/money";
import { BOTAO_PRIMARIO, BOTAO_GHOST, ROTULO_SECAO, PAGINA_WRAP, PAGINA_CARTAO } from "../../estilos";

async function buscarProduto(slug: string, produtoSlug: string) {
  const supabase = await createClient();
  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("id, nome, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!estabelecimento) return null;

  const { data: produto } = await supabase
    .from("produtos")
    .select("id, nome, descricao, preco_centavos, estoque, foto_url, tags, slug, meta_titulo, meta_descricao")
    .eq("estabelecimento_id", estabelecimento.id)
    .eq("slug", produtoSlug)
    .eq("ativo", true)
    .maybeSingle();
  if (!produto) return null;

  return { estabelecimento, produto };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; produto: string }>;
}): Promise<Metadata> {
  const { slug, produto: produtoSlug } = await params;
  const dados = await buscarProduto(slug, produtoSlug);
  if (!dados) return {};

  const { estabelecimento, produto } = dados;
  const titulo = produto.meta_titulo || `${produto.nome} — ${estabelecimento.nome}`;
  const descricao =
    produto.meta_descricao || produto.descricao?.slice(0, 155) || `${produto.nome} em ${estabelecimento.nome}.`;

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      images: produto.foto_url ? [produto.foto_url] : undefined,
    },
  };
}

export default async function ProdutoPublicoPage({
  params,
}: {
  params: Promise<{ slug: string; produto: string }>;
}) {
  const { slug, produto: produtoSlug } = await params;
  const dados = await buscarProduto(slug, produtoSlug);
  if (!dados) notFound();

  const { produto } = dados;
  const esgotado = produto.estoque <= 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.meta_descricao || produto.descricao || undefined,
    image: produto.foto_url || undefined,
    offers: {
      "@type": "Offer",
      price: (produto.preco_centavos / 100).toFixed(2),
      priceCurrency: "BRL",
      availability: esgotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className={PAGINA_WRAP}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={`${PAGINA_CARTAO} flex flex-col gap-4 p-6`}>
        {produto.foto_url ? (
          /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
          <img
            src={produto.foto_url}
            alt={produto.nome}
            className="aspect-square w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-tenant-linha text-sm opacity-60">
            Sem foto
          </div>
        )}

        <div>
          <h1 className="font-display text-2xl text-tenant-fg">{produto.nome}</h1>
          <p className="mt-1 text-xl font-medium tabular-nums text-tenant-fg">
            {centavosToBRL(produto.preco_centavos)}
          </p>
        </div>

        {produto.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {produto.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-tenant-linha px-3 py-1 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {produto.descricao && (
          <section>
            <p className={`${ROTULO_SECAO} mb-2`}>Sobre o produto</p>
            <p className="text-sm leading-relaxed text-tenant-fg opacity-85">{produto.descricao}</p>
          </section>
        )}

        {esgotado ? (
          <p className="text-sm font-medium opacity-70">Esgotado no momento.</p>
        ) : (
          <Link href={`/b/${slug}/loja?adicionar=${produto.id}`} className={BOTAO_PRIMARIO}>
            Comprar — retirada no local
          </Link>
        )}

        <Link href={`/b/${slug}/loja`} className={`${BOTAO_GHOST} w-fit`}>
          Ver mais produtos da loja
        </Link>
      </div>
    </div>
  );
}
