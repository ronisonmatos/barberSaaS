import { centavosToBRL } from "@/lib/money";

export type ProdutoCarrinho = {
  id: string;
  nome: string;
  preco_centavos: number;
  foto_url: string | null;
  estoque: number;
};

/**
 * Lista de produtos com stepper de quantidade -- compartilhada entre o passo opcional do wizard
 * de agendar e a página da loja (/b/{slug}/loja).
 */
export function CarrinhoProdutos({
  produtos,
  carrinho,
  onChange,
}: {
  produtos: ProdutoCarrinho[];
  carrinho: Record<string, number>;
  onChange: (produtoId: string, quantidade: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {produtos.map((p) => {
        const qtd = carrinho[p.id] ?? 0;
        const esgotado = p.estoque <= 0;
        return (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-md border border-tenant-linha bg-tenant-bg p-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              {p.foto_url ? (
                /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
                <img src={p.foto_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-md border border-tenant-linha" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.nome}</p>
                <p className="text-xs tabular-nums opacity-70">{centavosToBRL(p.preco_centavos)}</p>
              </div>
            </div>
            {esgotado ? (
              <span className="shrink-0 text-xs opacity-60">Esgotado</span>
            ) : (
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  disabled={qtd === 0}
                  onClick={() => onChange(p.id, Math.max(0, qtd - 1))}
                  aria-label={`Diminuir quantidade de ${p.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-tenant-linha text-base disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm tabular-nums">{qtd}</span>
                <button
                  type="button"
                  disabled={qtd >= p.estoque}
                  onClick={() => onChange(p.id, Math.min(p.estoque, qtd + 1))}
                  aria-label={`Aumentar quantidade de ${p.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-tenant-linha text-base disabled:opacity-30"
                >
                  +
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
