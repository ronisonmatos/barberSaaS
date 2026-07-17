"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EstabelecimentoHeader({
  slug,
  nome,
  logoUrl,
}: {
  slug: string;
  nome: string;
  logoUrl: string | null;
}) {
  const pathname = usePathname();
  // Home (/b/{slug}) já mostra logo+nome no hero do próprio card — o header duplicaria.
  if (pathname === `/b/${slug}`) return null;

  return (
    <header className="flex flex-col items-center gap-2 border-b border-tenant-linha px-4 py-6 text-center">
      <Link href={`/b/${slug}`} className="flex flex-col items-center gap-2">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
          <img
            src={logoUrl}
            alt={nome}
            className="size-[88px] rounded-full border border-tenant-linha object-cover"
          />
        ) : (
          <div className="flex size-[88px] items-center justify-center rounded-full border border-tenant-linha text-xs opacity-60">
            Logo
          </div>
        )}
        <span className="text-2xl font-bold tracking-tight text-tenant-fg">{nome}</span>
      </Link>
    </header>
  );
}
