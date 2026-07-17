"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SECOES_CONFIGURACAO } from "./secoes";

export function ConfiguracoesNav({ papel }: { papel: "owner" | "staff" }) {
  const pathname = usePathname();
  const secoes = SECOES_CONFIGURACAO.filter((s) => !s.ownerOnly || papel === "owner");

  return (
    <nav className="flex flex-1 flex-col gap-1">
      <Link
        href="/app"
        className="mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-cinza-600 transition-colors duration-150 hover:bg-marfim hover:text-carvao"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Voltar
      </Link>
      {secoes.map((secao) => {
        const ativo = pathname.startsWith(secao.href);
        return (
          <Link
            key={secao.href}
            href={secao.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
              ativo
                ? "border-latao bg-marfim font-medium text-carvao"
                : "border-transparent text-cinza-600 hover:bg-marfim hover:text-carvao"
            }`}
          >
            <secao.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {secao.label}
          </Link>
        );
      })}
    </nav>
  );
}
