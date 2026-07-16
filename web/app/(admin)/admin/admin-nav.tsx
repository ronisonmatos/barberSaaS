"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/estabelecimentos", label: "Estabelecimentos" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/suporte", label: "Suporte" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map((link) => {
        const ativo = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
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
