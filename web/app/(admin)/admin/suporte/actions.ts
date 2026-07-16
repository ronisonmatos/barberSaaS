"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";

export type FormState = { error?: string } | undefined;

const schema = z.object({ mensagem: z.string().trim().min(1, { error: "Escreva uma mensagem." }) });

export async function responderTicketAdmin(
  ticketId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { userId } = await getSuperAdmin();
  const parsed = schema.safeParse({ mensagem: formData.get("mensagem") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets_suporte_mensagens")
    .insert({ ticket_id: ticketId, autor_id: userId, mensagem: parsed.data.mensagem });
  if (error) return { error: error.message };

  revalidatePath(`/admin/suporte/${ticketId}`);
  return undefined;
}

export async function alterarStatusTicketAdmin(
  ticketId: string,
  novoStatus: "aberto" | "em_andamento" | "resolvido"
) {
  await getSuperAdmin();
  const supabase = await createClient();
  await supabase.from("tickets_suporte").update({ status: novoStatus }).eq("id", ticketId);
  revalidatePath(`/admin/suporte/${ticketId}`);
  revalidatePath("/admin/suporte");
}
