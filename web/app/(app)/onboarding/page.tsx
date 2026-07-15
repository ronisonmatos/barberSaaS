import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membro } = await supabase
    .from("membros_barbearia")
    .select("barbearia_id")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membro) redirect("/app");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold">Vamos criar sua barbearia</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Você ganha 14 dias de teste grátis a partir de agora.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
