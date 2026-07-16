"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";

export type FormState = { error?: string } | undefined;

const schemaAbrir = z.object({
  assunto: z.string().trim().min(3, { error: "Assunto deve ter ao menos 3 caracteres." }),
  mensagem: z.string().trim().min(1, { error: "Descreva o problema ou dúvida." }),
});

export async function abrirTicket(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { userId, estabelecimento } = await getEstabelecimentoAtivo();
  const parsed = schemaAbrir.safeParse({
    assunto: formData.get("assunto"),
    mensagem: formData.get("mensagem"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("tickets_suporte")
    .insert({ estabelecimento_id: estabelecimento.id, aberto_por: userId, assunto: parsed.data.assunto })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: msgError } = await supabase
    .from("tickets_suporte_mensagens")
    .insert({ ticket_id: ticket.id, autor_id: userId, mensagem: parsed.data.mensagem });
  if (msgError) return { error: msgError.message };

  revalidatePath("/app/suporte");
  redirect(`/app/suporte/${ticket.id}`);
}

const schemaResponder = z.object({ mensagem: z.string().trim().min(1, { error: "Escreva uma mensagem." }) });

export async function responderTicketEstabelecimento(
  ticketId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { userId } = await getEstabelecimentoAtivo();
  const parsed = schemaResponder.safeParse({ mensagem: formData.get("mensagem") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets_suporte_mensagens")
    .insert({ ticket_id: ticketId, autor_id: userId, mensagem: parsed.data.mensagem });
  if (error) return { error: error.message };

  revalidatePath(`/app/suporte/${ticketId}`);
  return undefined;
}

export async function alterarStatusTicketEstabelecimento(ticketId: string, novoStatus: "aberto" | "resolvido") {
  await getEstabelecimentoAtivo();
  const supabase = await createClient();
  await supabase.from("tickets_suporte").update({ status: novoStatus }).eq("id", ticketId);
  revalidatePath(`/app/suporte/${ticketId}`);
  revalidatePath("/app/suporte");
}
