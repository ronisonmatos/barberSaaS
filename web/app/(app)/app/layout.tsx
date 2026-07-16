import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { signOut } from "@/app/actions/auth";
import { AppNav } from "./app-nav";
import { BottomNav } from "./bottom-nav";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const trialAte = new Date(`${estabelecimento.trial_ate}T00:00:00`).toLocaleDateString("pt-BR");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden shrink-0 flex-col border-r border-linha bg-marfim-2 p-4 md:flex md:w-56">
        <div className="mb-6 flex flex-col items-start gap-2">
          {estabelecimento.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
            <img
              src={estabelecimento.logo_url}
              alt={estabelecimento.nome}
              className="h-16 w-16 shrink-0 rounded-md border border-linha object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-carvao">{estabelecimento.nome}</p>
            <p className="text-xs text-cinza-600">
              {estabelecimento.status === "trial" ? `Trial até ${trialAte}` : estabelecimento.status}
            </p>
          </div>
        </div>
        <AppNav />
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start no-underline">
            Sair
          </Button>
        </form>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-linha bg-marfim-2 px-4 py-3 md:hidden">
          {estabelecimento.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- logo em bucket público, sem necessidade de otimização do next/image */
            <img
              src={estabelecimento.logo_url}
              alt={estabelecimento.nome}
              className="h-8 w-8 shrink-0 rounded-md border border-linha object-cover"
            />
          ) : null}
          <p className="truncate font-display text-base text-carvao">{estabelecimento.nome}</p>
        </header>
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomNav signOutAction={signOut} />
    </div>
  );
}
