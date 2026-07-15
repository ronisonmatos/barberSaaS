"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string } | undefined;

const schema = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Use apenas letras minúsculas, números e hífen.",
    })
    .min(3, { error: "O endereço deve ter ao menos 3 caracteres." }),
});

export async function criarBarbearia(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("onboarding_criar_barbearia", {
    p_nome: parsed.data.nome,
    p_slug: parsed.data.slug,
  });

  if (error) {
    if (error.message.includes("barbearias_slug_key")) {
      return { error: "Esse endereço já está em uso, escolha outro." };
    }
    return { error: error.message };
  }

  revalidatePath("/app");
  redirect("/app");
}
