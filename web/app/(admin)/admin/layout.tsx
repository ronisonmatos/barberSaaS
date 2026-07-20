import { getSuperAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "./admin-nav";
import { AdminBottomNav } from "./admin-bottom-nav";
import { NotificacoesBellAdmin } from "./notificacoes-bell";
import { Button } from "@/components/ui/button";
import { BrandFooter } from "@/components/brand-footer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { nome } = await getSuperAdmin();
  const supabase = await createClient();
  const { data: notificacoes } = await supabase
    .from("notificacoes")
    .select("*")
    .eq("tipo", "demo_ativacao_solicitada")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-linha bg-marfim-2 p-4 md:flex">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem necessidade de otimização do next/image */}
            <img src="/brand/comptus-simbolo-fundo-claro.svg" alt="" className="h-7 w-auto" />
            <div className="min-w-0">
              <p className="font-display text-lg text-carvao">Admin</p>
              <p className="truncate text-xs text-cinza-600">{nome}</p>
            </div>
          </div>
          <NotificacoesBellAdmin notificacoesIniciais={notificacoes ?? []} alinhamento="esquerda" />
        </div>
        <AdminNav />
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
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, sem necessidade de otimização do next/image */}
          <img src="/brand/comptus-simbolo-fundo-claro.svg" alt="" className="h-6 w-auto" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base text-carvao">Admin</p>
            <p className="truncate text-xs text-cinza-600">{nome}</p>
          </div>
          <NotificacoesBellAdmin notificacoesIniciais={notificacoes ?? []} />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <AdminBottomNav signOutAction={signOut} />
    </div>
  );
}
