import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { signOut } from "@/app/actions/auth";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { Button } from "@/components/ui/button";
import { BrandFooter } from "@/components/brand-footer";

const STATUS_LABEL: Record<string, string> = {
  inadimplente: "Inadimplente",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  const trialAte = new Date(`${estabelecimento.trial_ate}T00:00:00`).toLocaleDateString("pt-BR");

  let planoNome: string | null = null;
  if (estabelecimento.plano_plataforma_id) {
    const supabase = await createClient();
    const { data: plano } = await supabase
      .from("planos_plataforma")
      .select("nome")
      .eq("id", estabelecimento.plano_plataforma_id)
      .maybeSingle();
    planoNome = plano?.nome ?? null;
  }

  const statusTexto =
    estabelecimento.status === "trial"
      ? `Trial até ${trialAte}`
      : estabelecimento.status === "ativa" && planoNome
        ? planoNome
        : (STATUS_LABEL[estabelecimento.status] ?? estabelecimento.status);

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
            <p className="text-xs text-cinza-600">{statusTexto}</p>
          </div>
        </div>
        <SidebarNav papel={papel} />
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start no-underline">
            Sair
          </Button>
        </form>
        <div className="mt-4 border-t border-linha pt-4">
          <BrandFooter />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
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
        <main className="min-w-0 flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomNav signOutAction={signOut} />
    </div>
  );
}
