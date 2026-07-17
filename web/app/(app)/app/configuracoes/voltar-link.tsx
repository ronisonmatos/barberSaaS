import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function VoltarConfiguracoes() {
  return (
    <Link
      href="/app/configuracoes"
      className="inline-flex w-fit items-center gap-1 text-sm text-cinza-600 transition-colors duration-150 hover:text-carvao md:hidden"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      Configurações
    </Link>
  );
}
