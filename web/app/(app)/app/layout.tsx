import Link from "next/link";
import { getBarbeariaAtiva } from "@/lib/barbearia-ativa";
import { signOut } from "@/app/actions/auth";

const LINKS = [
  { href: "/app/agenda", label: "Agenda" },
  { href: "/app/servicos", label: "Serviços" },
  { href: "/app/profissionais", label: "Profissionais" },
  { href: "/app/bloqueios", label: "Bloqueios" },
  { href: "/app/clientes", label: "Clientes" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { barbearia } = await getBarbeariaAtiva();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6">
          <p className="font-semibold">{barbearia.nome}</p>
          <p className="text-xs text-neutral-500">
            {barbearia.status === "trial" ? `Trial até ${barbearia.trial_ate}` : barbearia.status}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800">
            Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
