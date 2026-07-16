import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
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

  redirect(membro ? "/app" : "/onboarding");
}
