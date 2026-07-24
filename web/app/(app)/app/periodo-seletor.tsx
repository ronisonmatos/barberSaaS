import Link from "next/link";
import { PERIODOS, type PeriodoKey } from "./periodo";

export function PeriodoSeletor({ periodo, basePath }: { periodo: PeriodoKey; basePath: string }) {
  return (
    <div className="flex gap-1 rounded-md border border-linha bg-marfim-2 p-1 text-sm">
      {(Object.keys(PERIODOS) as PeriodoKey[]).map((chave) => (
        <Link
          key={chave}
          href={`${basePath}?periodo=${chave}`}
          aria-current={periodo === chave ? "page" : undefined}
          className={`rounded-sm px-3 py-1.5 transition-colors duration-150 ${
            periodo === chave ? "bg-latao text-carvao" : "text-cinza-600 hover:text-carvao"
          }`}
        >
          {PERIODOS[chave].label}
        </Link>
      ))}
    </div>
  );
}
