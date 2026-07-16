import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSuperAdmin(): Promise<{ userId: string; nome: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("usuarios").select("nome, papel").eq("id", user.id).single();

  if (!perfil || perfil.papel !== "super_admin") redirect("/app");

  return { userId: user.id, nome: perfil.nome };
}
