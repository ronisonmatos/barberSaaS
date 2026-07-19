"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Scissors, UserSquare2, Ban, Users, Settings, ShoppingBag, Package, Award, Repeat } from "lucide-react";

const LINKS = [
  { href: "/app", label: "Painel", icon: LayoutDashboard },
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/produtos", label: "Produtos", icon: ShoppingBag },
  { href: "/app/pedidos", label: "Pedidos", icon: Package },
  { href: "/app/fidelidade", label: "Fidelidade", icon: Award },
  { href: "/app/assinaturas", label: "Assinaturas", icon: Repeat },
  { href: "/app/profissionais", label: "Profissionais", icon: UserSquare2 },
  { href: "/app/bloqueios", label: "Bloqueios", icon: Ban },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map((link) => {
        const ativo = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
              ativo
                ? "border-latao bg-marfim font-medium text-carvao"
                : "border-transparent text-cinza-600 hover:bg-marfim hover:text-carvao"
            }`}
          >
            <link.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
