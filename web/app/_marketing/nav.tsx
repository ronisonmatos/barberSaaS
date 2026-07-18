"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#planos", label: "Planos" },
];

export function MarketingNav() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-linha-escuro bg-carvao/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem necessidade de otimização do next/image */}
        <img src="/brand/comptus-logotipo-fundo-escuro.svg" alt="Comptus" className="h-6 w-auto" />

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-marfim/80 hover:text-marfim">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-sm text-marfim/80 hover:text-marfim">
            Entrar
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-latao px-4 text-sm font-medium text-carvao hover:bg-latao-escuro"
          >
            Criar conta grátis
          </Link>
        </div>

        <button
          type="button"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className="flex h-11 w-11 items-center justify-center text-marfim md:hidden"
        >
          {aberto ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
        </button>
      </div>

      {aberto && (
        <div className="flex flex-col gap-1 border-t border-linha-escuro bg-carvao px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="rounded-md px-3 py-3 text-sm text-marfim/80 hover:bg-carvao-2"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setAberto(false)}
            className="rounded-md px-3 py-3 text-sm text-marfim/80 hover:bg-carvao-2"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            onClick={() => setAberto(false)}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-md bg-latao px-4 text-sm font-medium text-carvao"
          >
            Criar conta grátis
          </Link>
        </div>
      )}
    </header>
  );
}
