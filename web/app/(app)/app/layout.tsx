import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { papelLabel } from "@/lib/papel-label";
import { signOut } from "@/app/actions/auth";
import { sairDoModoSuporte } from "./actions-modo-suporte";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { NotificacoesBell } from "./notificacoes-bell";
import { Button } from "@/components/ui/button";
import { BrandFooter } from "@/components/brand-footer";

const STATUS_LABEL: Record<string, string> = {
  inadimplente: "Inadimplente",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { estabelecimento, papel, usuarioNome, usuarioGenero, modoSuporte } = await getEstabelecimentoAtivo();
  const trialAte = new Date(`${estabelecimento.trial_ate}T00:00:00`).toLocaleDateString("pt-BR");

  const supabase = await createClient();

  let planoNome: string | null = null;
  if (estabelecimento.plano_plataforma_id) {
    const { data: plano } = await supabase
      .from("planos_plataforma")
      .select("nome")
      .eq("id", estabelecimento.plano_plataforma_id)
      .maybeSingle();
    planoNome = plano?.nome ?? null;
  }

  const { data: notificacoes } = await supabase
    .from("notificacoes")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const statusTexto =
    estabelecimento.status === "trial"
      ? `Trial até ${trialAte}`
      : estabelecimento.status === "ativa" && planoNome
        ? planoNome
        : (STATUS_LABEL[estabelecimento.status] ?? estabelecimento.status);

  return (
    <div className="flex min-h-screen flex-col">
      {modoSuporte && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-latao bg-latao/15 px-4 py-2 text-sm text-carvao">
          <span>
            Modo suporte — visualizando como <strong>{estabelecimento.nome}</strong>.
          </span>
          <form action={sairDoModoSuporte}>
            <Button type="submit" variant="ghost" className="text-sm underline">
              Sair do modo suporte
            </Button>
          </form>
        </div>
      )}
      <div className="flex flex-1">
        <aside className="hidden shrink-0 flex-col border-r border-linha bg-marfim-2 p-4 md:flex md:w-56">
          <div className="mb-6 flex flex-col items-start gap-2">
            <div className="flex w-full items-center justify-end">
              <NotificacoesBell
                estabelecimentoId={estabelecimento.id}
                notificacoesIniciais={notificacoes ?? []}
                alinhamento="esquerda"
              />
            </div>
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
          <div className="mt-auto border-t border-linha pt-3">
            <p className="truncate text-sm font-medium text-carvao">{usuarioNome}</p>
            <p className="text-xs text-cinza-600">{papelLabel(papel, usuarioGenero)}</p>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="w-full justify-start no-underline">
                Sair
              </Button>
            </form>
          </div>
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
            <p className="min-w-0 flex-1 truncate font-display text-base text-carvao">{estabelecimento.nome}</p>
            <NotificacoesBell estabelecimentoId={estabelecimento.id} notificacoesIniciais={notificacoes ?? []} />
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
        <BottomNav
          signOutAction={signOut}
          usuarioNome={usuarioNome}
          papel={papel}
          usuarioGenero={usuarioGenero}
        />
      </div>
    </div>
  );
}
