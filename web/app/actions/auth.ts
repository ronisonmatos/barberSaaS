"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;

const signUpSchema = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z
    .string()
    .min(8, { error: "A senha deve ter ao menos 8 caracteres." }),
});

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { nome: parsed.data.nome } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: "Verifique seu e-mail para confirmar o cadastro antes de entrar." };
  }

  redirect("/onboarding");
}

const signInSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe a senha." }),
});

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const definirSenhaSchema = z.object({
  password: z.string().min(8, { error: "A senha deve ter ao menos 8 caracteres." }),
});

export async function definirSenha(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = definirSenhaSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Convite expirado ou inválido. Peça um novo convite." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

const esqueciSenhaSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function solicitarRecuperacaoSenha(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = esqueciSenhaSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  // Não revela se o e-mail existe ou não (evita enumeração de contas) -- o Supabase só envia
  // o e-mail se a conta existir, e aqui sempre respondemos com a mesma mensagem de sucesso.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/definir-senha`,
  });

  return undefined;
}
