"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { brlToCentavos } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "../configuracoes/limites";

export type FormState = { error?: string } | undefined;

async function verificarLimiteProdutos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  estabelecimento: { id: string; plano_plataforma_id: string | null },
  excluirId?: string
): Promise<string | null> {
  if (!estabelecimento.plano_plataforma_id) return null;

  let contagem = supabase
    .from("produtos")
    .select("id", { count: "exact", head: true })
    .eq("estabelecimento_id", estabelecimento.id)
    .eq("ativo", true);
  if (excluirId) contagem = contagem.neq("id", excluirId);

  const [{ count: ativos }, { data: plano }] = await Promise.all([
    contagem,
    supabase
      .from("planos_plataforma")
      .select("max_produtos")
      .eq("id", estabelecimento.plano_plataforma_id)
      .single(),
  ]);

  const limite = plano?.max_produtos ?? null;
  if (limite !== null && (ativos ?? 0) >= limite) {
    return `Limite de produtos do plano atingido (${limite}). Faça upgrade de plano para adicionar mais.`;
  }
  return null;
}

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

function parseTags(valor: FormDataEntryValue | null): string[] {
  if (typeof valor !== "string") return [];
  return Array.from(
    new Set(
      valor
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  descricao: z.string().trim().optional(),
  preco: z.string().min(1, { error: "Informe o preço." }),
  estoque: z.coerce.number().int().min(0, { error: "Estoque não pode ser negativo." }),
  ativo: z.boolean(),
  slugPersonalizado: z.string().trim().optional(),
  metaTitulo: z.string().trim().max(60, { error: "Título de busca: máx. 60 caracteres." }).optional(),
  metaDescricao: z.string().trim().max(155, { error: "Descrição de busca: máx. 155 caracteres." }).optional(),
});

export async function salvarProduto(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    preco: formData.get("preco"),
    estoque: formData.get("estoque"),
    ativo: formData.get("ativo") === "on",
    slugPersonalizado: formData.get("slugPersonalizado") || undefined,
    metaTitulo: formData.get("metaTitulo") || undefined,
    metaDescricao: formData.get("metaDescricao") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const tags = parseTags(formData.get("tags"));

  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const preco_centavos = brlToCentavos(parsed.data.preco);
  if (!Number.isFinite(preco_centavos) || preco_centavos < 0) {
    return { error: "Preço inválido." };
  }

  if (parsed.data.ativo) {
    const erroLimite = await verificarLimiteProdutos(supabase, estabelecimento, parsed.data.id);
    if (erroLimite) return { error: erroLimite };
  }

  let fotoUrl: string | undefined;
  const arquivo = formData.get("foto");
  if (arquivo instanceof File && arquivo.size > 0) {
    if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) {
      return { error: "Use PNG, JPEG, WEBP ou SVG." };
    }
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      return { error: "Imagem muito grande (máx. 5MB)." };
    }
    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${estabelecimento.id}/produtos/${crypto.randomUUID()}.${extensao}`;
    const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      contentType: arquivo.type,
    });
    if (uploadError) return { error: uploadError.message };
    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(caminho);
    fotoUrl = publicUrl;
  }

  const slug = await gerarSlugUnico(
    supabase,
    estabelecimento.id,
    parsed.data.slugPersonalizado || parsed.data.nome,
    parsed.data.id
  );

  const payload = {
    estabelecimento_id: estabelecimento.id,
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    preco_centavos,
    estoque: parsed.data.estoque,
    ativo: parsed.data.ativo,
    desativado_por_limite_plano: false,
    tags,
    slug,
    meta_titulo: parsed.data.metaTitulo || null,
    meta_descricao: parsed.data.metaDescricao || null,
    ...(fotoUrl ? { foto_url: fotoUrl } : {}),
  };

  const { error } = parsed.data.id
    ? await supabase.from("produtos").update(payload).eq("id", parsed.data.id)
    : await supabase.from("produtos").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/app/produtos");
  revalidatePath(`/b/${estabelecimento.slug}`);
  revalidatePath(`/b/${estabelecimento.slug}/loja`);
  revalidatePath(`/b/${estabelecimento.slug}/loja/${slug}`);
  return undefined;
}

export async function alternarAtivoProduto(id: string, ativo: boolean): Promise<{ error?: string }> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  if (ativo) {
    const erroLimite = await verificarLimiteProdutos(supabase, estabelecimento, id);
    if (erroLimite) return { error: erroLimite };
  }

  await supabase
    .from("produtos")
    .update({ ativo, desativado_por_limite_plano: false })
    .eq("id", id);
  revalidatePath("/app/produtos");
  revalidatePath(`/b/${estabelecimento.slug}`);
  revalidatePath(`/b/${estabelecimento.slug}/loja`);
  return {};
}
