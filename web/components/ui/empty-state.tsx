import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

const BOTAO_SECUNDARIO_CLASSES =
  "inline-flex h-11 items-center justify-center rounded-md border border-linha px-4 text-sm font-medium text-carvao transition-colors duration-150 hover:bg-marfim-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2";

type Acao = { label: string; href: string } | { label: string; onClick: () => void };

export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  acao,
}: {
  icon?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: Acao;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-linha p-8 text-center">
      {Icon && <Icon className="h-6 w-6 text-cinza-300" strokeWidth={1.5} />}
      <p className="font-medium text-carvao">{titulo}</p>
      {descricao && <p className="text-sm text-cinza-600">{descricao}</p>}
      {acao && "href" in acao && (
        <Link href={acao.href} className={`mt-2 ${BOTAO_SECUNDARIO_CLASSES}`}>
          {acao.label}
        </Link>
      )}
      {acao && "onClick" in acao && (
        <Button variant="secondary" onClick={acao.onClick} className="mt-2 text-sm">
          {acao.label}
        </Button>
      )}
    </div>
  );
}
