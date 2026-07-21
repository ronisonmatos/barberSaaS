import Link from "next/link";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { Heading } from "@/components/ui/heading";

function diasRestantes(expiraEm: string | null): string {
  if (!expiraEm) return "—";
  const dias = Math.max(0, Math.ceil((new Date(expiraEm).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

export default async function EditarRascunhoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { estabelecimento } = await getSuperAdminERascunho(id);

  const abas = [
    { href: `/admin/estabelecimentos/${id}/editar`, label: "Identidade" },
    { href: `/admin/estabelecimentos/${id}/editar/servicos`, label: "Serviços" },
    { href: `/admin/estabelecimentos/${id}/editar/profissionais`, label: "Profissionais" },
    { href: `/admin/estabelecimentos/${id}/editar/produtos`, label: "Produtos" },
    { href: `/admin/estabelecimentos/${id}/editar/assinaturas`, label: "Assinaturas" },
    { href: `/admin/estabelecimentos/${id}/editar/fotos`, label: "Fotos" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={`/admin/estabelecimentos/${id}`} className="text-sm text-cinza-600 underline">
          ← {estabelecimento.nome}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Heading>Editar página de demonstração</Heading>
          <a
            href={`/b/${estabelecimento.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-carvao underline"
          >
            Pré-visualizar página pública →
          </a>
        </div>
        <p className="text-sm text-latao-escuro">
          Expira em {diasRestantes(estabelecimento.rascunho_expira_em)} se ninguém reivindicar.
        </p>
      </div>

      <nav className="flex gap-2 border-b border-linha">
        {abas.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="px-3 py-2 text-sm font-medium text-cinza-600 hover:text-carvao"
          >
            {aba.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
