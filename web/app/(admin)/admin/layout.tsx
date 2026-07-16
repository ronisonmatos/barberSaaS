import { getSuperAdmin } from "@/lib/admin-guard";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "./admin-nav";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { nome } = await getSuperAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-linha bg-marfim-2 p-4 md:flex">
        <div className="mb-6">
          <p className="font-display text-lg text-carvao">BarberSaaS Admin</p>
          <p className="text-xs text-cinza-600">{nome}</p>
        </div>
        <AdminNav />
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start no-underline">
            Sair
          </Button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
