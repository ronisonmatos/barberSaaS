"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminERascunho } from "@/lib/admin-guard";
import { brlToCentavos } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "@/app/(app)/app/configuracoes/limites";

export type FormState = { error?: string } | undefined;

async function gerarSlugUnico(
  supabase: Awaited<ReturnType<typeof createClient>>,
  estabelecimentoId: string,
  base: string,
  excluirId?: string
): Promise<string> {
  const raiz = slugify(base) || "produto";
  let candidato = raiz;
  let sufixo = 2;
  for (;;) {
    let query = supabase
      .from("produtos")
      .select("id", { head: true, count: "exact" })
      .eq("estabelecimento_id", estabelecimentoId)
      .eq("slug", candidato);
    if (excluirId) query = query.neq("id", excluirId);
    const { count } = await query;
    if (!count) return candidato;
    candidato = `${raiz}-${sufixo}`;
    sufixo++;
  }
}

const schema = z.object({
  id: z.string().uuid().optional(),
  estabelecimentoId: z.string().uuid(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  preco: z.string().min(1, { error: "Informe o preço." }),
});

export async function salvarProdutoRascunho(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    estabelecimentoId: formData.get("estabelecimentoId"),
    nome: formData.get("nome"),
    preco: formData.get("preco"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await getSuperAdminERascunho(parsed.data.estabelecimentoId);
  const supabase = await createClient();

  const preco_centavos = brlToCentavos(parsed.data.preco);
  if (!Number.isFinite(preco_centavos) || preco_centavos < 0) {
    return { error: "Preço inválido." };
  }

  let fotoUrl: string | undefined;
  const arquivo = formData.get("foto");
  if (arquivo instanceof File && arquivo.size > 0) {
    if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) return { error: "Use PNG, JPEG, WEBP ou SVG." };
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) return { error: "Imagem muito grande (máx. 5MB)." };
    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${parsed.data.estabelecimentoId}/produtos/${crypto.randomUUID()}.${extensao}`;
    const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      contentType: arquivo.type,
    });
    if (uploadError) return { error: uploadError.message };
    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(caminho);
    fotoUrl = publicUrl;
  }

  const slug = await gerarSlugUnico(supabase, parsed.data.estabelecimentoId, parsed.data.nome, parsed.data.id);

  const payload = {
    estabelecimento_id: parsed.data.estabelecimentoId,
    nome: parsed.data.nome,
    preco_centavos,
    slug,
    ...(fotoUrl ? { foto_url: fotoUrl } : {}),
  };

  const { error } = parsed.data.id
    ? await supabase.from("produtos").update(payload).eq("id", parsed.data.id)
    : await supabase.from("produtos").insert(payload);

  if (error) return { error: error.message };

  revalidatePath(`/admin/estabelecimentos/${parsed.data.estabelecimentoId}/editar/produtos`);
  return undefined;
}

export async function alternarAtivoProdutoRascunho(estabelecimentoId: string, id: string, ativo: boolean) {
  await getSuperAdminERascunho(estabelecimentoId);
  const supabase = await createClient();
  await supabase.from("produtos").update({ ativo }).eq("id", id).eq("estabelecimento_id", estabelecimentoId);
  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/editar/produtos`);
}
