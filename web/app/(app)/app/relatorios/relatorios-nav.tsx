"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/app/relatorios/financeiro", label: "Financeiro", ownerOnly: true },
  { href: "/app/relatorios/agendamentos", label: "Agendamentos", ownerOnly: false },
  { href: "/app/relatorios/produtos", label: "Produtos", ownerOnly: false },
];

export function RelatoriosNav({ papel }: { papel: "owner" | "staff" }) {
  const pathname = usePathname();
  const abas = ABAS.filter((aba) => !aba.ownerOnly || papel === "owner");

  return (
    <div className="flex gap-1 border-b border-linha">
      {abas.map((aba) => {
        const ativo = pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativo ? "page" : undefined}
            className={`border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
              ativo ? "border-latao font-medium text-carvao" : "border-transparent text-cinza-600 hover:text-carvao"
            }`}
          >
            {aba.label}
          </Link>
        );
      })}
    </div>
  );
}
