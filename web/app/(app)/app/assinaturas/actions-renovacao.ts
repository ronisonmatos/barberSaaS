"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { normalizePhoneBR } from "@/lib/phone";
import { gerarCobrancaPixAssinatura } from "@/lib/assinatura-cobranca";

const schema = z.object({
  assinaturaId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Informe o nome do cliente." }),
  telefone: z.string().min(1, { error: "Informe o telefone do cliente." }),
  email: z.email({ error: "Informe um e-mail válido." }),
});

export async function renovarAssinaturaPix(formData: FormData): Promise<{
  error?: string;
  pagamentoId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
}> {
  const { estabelecimento } = await getEstabelecimentoAtivo();

  const parsed = schema.safeParse({
    assinaturaId: formData.get("assinaturaId"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const telefone = normalizePhoneBR(parsed.data.telefone);
  if (!telefone) {
    return { error: "Telefone inválido. Use um número de celular brasileiro com DDD." };
  }

  const supabase = await createClient();

  const { data: assinatura } = await supabase
    .from("assinaturas_clientes")
    .select("id, plano_id")
    .eq("id", parsed.data.assinaturaId)
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();
  if (!assinatura) return { error: "Assinatura não encontrada." };

  // Reaproveita a mesma RPC de assinar: como o telefone é o mesmo cliente e o plano é o mesmo, o
  // unique(cliente_id, plano_id) garante que isso RENOVA a linha existente (não cria uma nova) --
  // fica 'pendente' até esse Pix ser pago, mesmo comportamento do cliente reassinando sozinho.
  const resultado = await gerarCobrancaPixAssinatura(supabase, {
    estabelecimentoId: estabelecimento.id,
    planoId: assinatura.plano_id,
    nome: parsed.data.nome,
    telefone,
    email: parsed.data.email,
  });
  if (resultado.error) return resultado;

  revalidatePath("/app/assinaturas");
  return resultado;
}
