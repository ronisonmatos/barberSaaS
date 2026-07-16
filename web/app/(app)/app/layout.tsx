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
        <div className="mb-6">
          <p className="font-display text-lg text-carvao">{estabelecimento.nome}</p>
          <p className="text-xs text-cinza-600">
            {estabelecimento.status === "trial" ? `Trial até ${trialAte}` : estabelecimento.status}
          </p>
        </div>
        <AppNav />
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start no-underline">
            Sair
          </Button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
      <BottomNav signOutAction={signOut} />
    </div>
  );
}
