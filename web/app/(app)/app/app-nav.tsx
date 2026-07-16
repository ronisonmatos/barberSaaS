"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app/agenda", label: "Agenda" },
  { href: "/app/servicos", label: "Serviços" },
  { href: "/app/profissionais", label: "Profissionais" },
  { href: "/app/bloqueios", label: "Bloqueios" },
  { href: "/app/clientes", label: "Clientes" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map((link) => {
        const ativo = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-md border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
              ativo
                ? "border-latao bg-marfim font-medium text-carvao"
                : "border-transparent text-cinza-600 hover:bg-marfim hover:text-carvao"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
