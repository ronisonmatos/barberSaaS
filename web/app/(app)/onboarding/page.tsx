import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membro } = await supabase
    .from("membros_estabelecimento")
    .select("estabelecimento_id")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membro) redirect("/app");

  return (
    <div className="flex min-h-screen items-center justify-center bg-marfim px-4">
      <Card className="max-w-md">
        <div className="flex flex-col gap-6">
          <div>
            <Heading>Vamos criar seu estabelecimento</Heading>
            <p className="text-sm text-cinza-600">
              Você ganha 14 dias de teste grátis a partir de agora.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </Card>
    </div>
  );
}
