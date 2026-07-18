"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, UserSquare2, MoreHorizontal, Scissors, Ban, LogOut, LayoutDashboard, Settings, ShoppingBag, Package } from "lucide-react";
import { papelLabel } from "@/lib/papel-label";

const PRINCIPAIS = [
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/profissionais", label: "Equipe", icon: UserSquare2 },
];

const MAIS = [
  { href: "/app", label: "Painel", icon: LayoutDashboard },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/produtos", label: "Produtos", icon: ShoppingBag },
  { href: "/app/pedidos", label: "Pedidos", icon: Package },
  { href: "/app/bloqueios", label: "Bloqueios", icon: Ban },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function BottomNav({
  signOutAction,
  usuarioNome,
  papel,
  usuarioGenero,
}: {
  signOutAction: () => void;
  usuarioNome: string;
  papel: "owner" | "staff";
  usuarioGenero: "masculino" | "feminino" | null;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-carvao/40 md:hidden"
          onClick={() => setAberto(false)}
        >
          <div
            className="absolute right-0 bottom-16 left-0 flex flex-col gap-1 rounded-t-lg border-t border-linha bg-marfim-2 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 border-b border-linha px-3 pb-2">
              <p className="truncate text-sm font-medium text-carvao">{usuarioNome}</p>
              <p className="text-xs text-cinza-600">{papelLabel(papel, usuarioGenero)}</p>
            </div>
            {MAIS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-carvao hover:bg-marfim"
              >
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
                {item.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-erro hover:bg-marfim"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.5} />
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-linha bg-marfim-2 md:hidden">
        {PRINCIPAIS.map((item) => {
          const ativo = pathname.startsWith(item.href);
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
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs text-cinza-600"
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
          Mais
        </button>
      </nav>
    </>
  );
}
