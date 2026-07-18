"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdmin } from "@/lib/admin-guard";
import { brlToCentavos } from "@/lib/money";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  // Nao usar .uuid() aqui: os planos seed (Essencial/Pro) tem ids sequenciais
  // (00000000-0000-0000-0000-000000000001/2) que nao passam na validacao estrita
  // de RFC4122 do Zod v4 (versao/variante invalidas) -- so precisa ser uma string nao vazia.
  id: z.string().min(1).optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  preco: z.string().min(1, { error: "Informe o preço." }),
  maxProfissionais: z.string().optional(),
  maxUsuarios: z.string().optional(),
  maxFotos: z.string().optional(),
  maxProdutos: z.string().optional(),
  whatsapp: z.boolean(),
  relatorios: z.boolean(),
  pagamentoOnline: z.boolean(),
  loja: z.boolean(),
  suporte: z.enum(["limitado", "prioritario"]),
  promocaoAtiva: z.boolean(),
  promocaoTipo: z.enum(["preco_fixo", "percentual"]).optional(),
  promocaoValor: z.string().optional(),
  promocaoPercentual: z.string().optional(),
  promocaoDuracaoMeses: z.string().optional(),
  promocaoAssinarAte: z.string().optional(),
  promocaoTitulo: z.string().optional(),
});

export async function salvarPlano(_prevState: FormState, formData: FormData): Promise<FormState> {
  await getSuperAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    preco: formData.get("preco"),
    maxProfissionais: formData.get("maxProfissionais") || undefined,
    maxUsuarios: formData.get("maxUsuarios") || undefined,
    maxFotos: formData.get("maxFotos") || undefined,
    maxProdutos: formData.get("maxProdutos") || undefined,
    whatsapp: formData.get("whatsapp") === "on",
    relatorios: formData.get("relatorios") === "on",
    pagamentoOnline: formData.get("pagamentoOnline") === "on",
    loja: formData.get("loja") === "on",
    suporte: formData.get("suporte") || "limitado",
    promocaoAtiva: formData.get("promocaoAtiva") === "on",
    promocaoTipo: formData.get("promocaoTipo") || undefined,
    promocaoValor: formData.get("promocaoValor") || undefined,
    promocaoPercentual: formData.get("promocaoPercentual") || undefined,
    promocaoDuracaoMeses: formData.get("promocaoDuracaoMeses") || undefined,
    promocaoAssinarAte: formData.get("promocaoAssinarAte") || undefined,
    promocaoTitulo: formData.get("promocaoTitulo") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const preco_centavos = brlToCentavos(parsed.data.preco);
  if (!Number.isFinite(preco_centavos) || preco_centavos < 0) {
    return { error: "Preço inválido." };
  }

  if (parsed.data.promocaoAtiva) {
    if (!parsed.data.promocaoTipo) return { error: "Escolha o tipo da promoção." };
    if (parsed.data.promocaoTipo === "preco_fixo" && !parsed.data.promocaoValor) {
      return { error: "Informe o preço promocional." };
    }
    if (parsed.data.promocaoTipo === "percentual" && !parsed.data.promocaoPercentual) {
      return { error: "Informe o percentual de desconto." };
    }
  }

  const supabase = await createClient();
  const payload = {
    nome: parsed.data.nome,
    preco_centavos,
    max_profissionais: parsed.data.maxProfissionais ? Number.parseInt(parsed.data.maxProfissionais, 10) : null,
    max_usuarios: parsed.data.maxUsuarios ? Number.parseInt(parsed.data.maxUsuarios, 10) : null,
    max_fotos: parsed.data.maxFotos ? Number.parseInt(parsed.data.maxFotos, 10) : null,
    max_produtos: parsed.data.maxProdutos ? Number.parseInt(parsed.data.maxProdutos, 10) : null,
    recursos: {
      whatsapp: parsed.data.whatsapp,
      relatorios: parsed.data.relatorios,
      pagamento_online: parsed.data.pagamentoOnline,
      loja: parsed.data.loja,
      suporte: parsed.data.suporte,
    },
    promocao_ativa: parsed.data.promocaoAtiva,
    promocao_tipo: parsed.data.promocaoAtiva ? parsed.data.promocaoTipo : null,
    promocao_valor_centavos:
      parsed.data.promocaoAtiva && parsed.data.promocaoTipo === "preco_fixo" && parsed.data.promocaoValor
        ? brlToCentavos(parsed.data.promocaoValor)
        : null,
    promocao_percentual:
      parsed.data.promocaoAtiva && parsed.data.promocaoTipo === "percentual" && parsed.data.promocaoPercentual
        ? Number.parseFloat(parsed.data.promocaoPercentual.replace(",", "."))
        : null,
    promocao_duracao_meses:
      parsed.data.promocaoAtiva && parsed.data.promocaoDuracaoMeses
        ? Number.parseInt(parsed.data.promocaoDuracaoMeses, 10)
        : null,
    promocao_assinar_ate: parsed.data.promocaoAtiva ? parsed.data.promocaoAssinarAte || null : null,
    promocao_titulo: parsed.data.promocaoAtiva ? parsed.data.promocaoTitulo || null : null,
  };

  const { error } = parsed.data.id
    ? await supabase.from("planos_plataforma").update(payload).eq("id", parsed.data.id)
    : await supabase.from("planos_plataforma").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/planos");
  return undefined;
}

export async function alternarAtivoPlano(id: string, ativo: boolean) {
  await getSuperAdmin();
  const supabase = await createClient();
  await supabase.from("planos_plataforma").update({ ativo }).eq("id", id);
  revalidatePath("/admin/planos");
}
