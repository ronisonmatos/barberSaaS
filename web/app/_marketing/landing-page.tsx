import Link from "next/link";
import { MarketingNav } from "./nav";
import { Hero } from "./hero";
import { ComoFunciona } from "./como-funciona";
import { Recursos } from "./recursos";
import { Planos } from "./planos";
import { CtaFinal } from "./cta-final";

export function LandingPage() {
  const ano = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-carvao">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <ComoFunciona />
        <Recursos />
        <Planos />
        <CtaFinal />
      </main>
      <footer className="border-t border-linha-escuro px-4 py-8">
        {/* Texto direto (em vez de BrandFooter) porque o tom de cinza padrão do componente
            é calibrado pra fundo claro (marfim) e não passa contraste AA sobre o carvão escuro daqui. */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-4 text-xs text-marfim/60">
            <Link href="/termos" className="underline hover:text-marfim">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="underline hover:text-marfim">
              Política de Privacidade
            </Link>
          </div>
          <p className="text-center text-xs text-marfim/60">
            © {ano} Comptus. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
