import Link from "next/link";
import { BrandFooter } from "@/components/brand-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-marfim">
      <header className="border-b border-linha px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem necessidade de otimização do next/image */}
            <img src="/brand/comptus-logotipo-fundo-claro.svg" alt="Comptus" className="h-6 w-auto" />
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">{children}</div>
      </main>
      <footer className="border-t border-linha px-4 py-6">
        <BrandFooter />
      </footer>
    </div>
  );
}
