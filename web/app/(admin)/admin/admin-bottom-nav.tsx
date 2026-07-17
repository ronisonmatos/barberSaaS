"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Package, MessageCircle, LogOut } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/estabelecimentos", label: "Estabelec.", icon: Building2 },
  { href: "/admin/planos", label: "Planos", icon: Package },
  { href: "/admin/suporte", label: "Suporte", icon: MessageCircle },
];

export function AdminBottomNav({ signOutAction }: { signOutAction: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-linha bg-marfim-2 md:hidden">
      {LINKS.map((item) => {
        const ativo = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              ativo ? "text-latao-escuro" : "text-cinza-600"
            }`}
          >
            <item.icon className="h-5 w-5" strokeWidth={ativo ? 2 : 1.5} />
            {item.label}
          </Link>
        );
      })}
      <form action={signOutAction} className="flex flex-1">
        <button
          type="submit"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs text-cinza-600"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} />
          Sair
        </button>
      </form>
    </nav>
  );
}
