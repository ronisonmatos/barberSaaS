import { Card } from "@/components/ui/card";
import { BrandFooter } from "@/components/brand-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-marfim px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem necessidade de otimização do next/image */}
      <img src="/brand/comptus-logotipo-fundo-claro.svg" alt="Comptus" className="h-8 w-auto" />
      <Card className="w-full max-w-sm">{children}</Card>
      <BrandFooter />
    </div>
  );
}
