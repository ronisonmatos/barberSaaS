import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";

export default async function ContaDesativadaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membro } = await supabase
    .from("membros_estabelecimento")
    .select("ativo")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) redirect("/onboarding");
  if (membro.ativo) redirect("/app");

  return (
    <div className="flex min-h-screen items-center justify-center bg-marfim px-4">
      <Card className="max-w-md">
        <div className="flex flex-col gap-4">
          <Heading>Sua conta foi desativada</Heading>
          <p className="text-sm text-cinza-600">
            O estabelecimento está no plano Free, que permite apenas 1 usuário no painel. Sua conta
            ficou temporariamente desativada porque o limite foi atingido.
          </p>
          <p className="text-sm text-cinza-600">
            Peça ao dono do estabelecimento para fazer upgrade de plano — assim que houver vaga, sua
            conta volta a funcionar automaticamente.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="secondary" className="w-full">
              Sair
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
