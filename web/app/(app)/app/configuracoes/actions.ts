"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getEstabelecimentoAtivo } from "@/lib/estabelecimento-ativo";
import { TAMANHO_MAX_LOGO_BYTES, TIPOS_LOGO_ACEITOS } from "./limites";

const LIMITE_USUARIOS_SEM_PLANO = 1;
const LIMITE_FOTOS_SEM_PLANO = 5;

export type FormState = { error?: string } | undefined;

const schemaPerfil = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  descricao: z.string().trim().max(140, { error: "Máx. 140 caracteres." }).optional(),
  sobre: z.string().trim().max(600, { error: "Máx. 600 caracteres." }).optional(),
  horarioTexto: z.string().trim().max(200, { error: "Máx. 200 caracteres." }).optional(),
  instagramUrl: z.string().trim().max(200).optional(),
  rua: z.string().trim().max(120).optional(),
  numero: z.string().trim().max(20).optional(),
  bairro: z.string().trim().max(80).optional(),
  cidade: z.string().trim().max(80).optional(),
  uf: z.string().trim().max(2).optional(),
  cep: z.string().trim().max(9).optional(),
});

export async function salvarPerfil(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const parsed = schemaPerfil.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    sobre: formData.get("sobre") || undefined,
    horarioTexto: formData.get("horarioTexto") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    rua: formData.get("rua") || undefined,
    numero: formData.get("numero") || undefined,
    bairro: formData.get("bairro") || undefined,
    cidade: formData.get("cidade") || undefined,
    uf: formData.get("uf") || undefined,
    cep: formData.get("cep") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const enderecoPreenchido = [
    parsed.data.rua,
    parsed.data.numero,
    parsed.data.bairro,
    parsed.data.cidade,
    parsed.data.uf,
    parsed.data.cep,
  ].some((v) => v);

  const supabase = await createClient();
  const { error } = await supabase
    .from("estabelecimentos")
    .update({
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      sobre: parsed.data.sobre || null,
      horario_texto: parsed.data.horarioTexto || null,
      instagram_url: parsed.data.instagramUrl || null,
      endereco: enderecoPreenchido
        ? {
            rua: parsed.data.rua || null,
            numero: parsed.data.numero || null,
            bairro: parsed.data.bairro || null,
            cidade: parsed.data.cidade || null,
            uf: parsed.data.uf || null,
            cep: parsed.data.cep || null,
          }
        : null,
    })
    .eq("id", estabelecimento.id);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes");
  revalidatePath("/app");
  revalidatePath(`/b/${estabelecimento.slug}`);
  return undefined;
}

export async function atualizarLogo(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const arquivo = formData.get("logo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Escolha uma imagem." };
  }
  if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) {
    return { error: "Use PNG, JPEG, WEBP ou SVG." };
  }
  if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
    return { error: "Imagem muito grande (máx. 5MB)." };
  }

  const supabase = await createClient();
  const extensao = arquivo.name.split(".").pop() ?? "png";
  const caminho = `${estabelecimento.id}/logo.${extensao}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
    upsert: true,
    contentType: arquivo.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(caminho);

  const { error: updateError } = await supabase
    .from("estabelecimentos")
    .update({ logo_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", estabelecimento.id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/app/configuracoes");
  return undefined;
}

export async function adicionarFotos(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const arquivos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);

  if (arquivos.length === 0) return { error: "Escolha ao menos uma imagem." };
  for (const arquivo of arquivos) {
    if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) {
      return { error: `"${arquivo.name}" não é PNG, JPEG, WEBP ou SVG.` };
    }
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      return { error: `"${arquivo.name}" é muito grande (máx. 5MB).` };
    }
  }

  const supabase = await createClient();

  const [{ count: fotosAtivas }, { count: fotosTotal }, { data: plano }] = await Promise.all([
    supabase
      .from("estabelecimento_fotos")
      .select("id", { count: "exact", head: true })
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true),
    supabase
      .from("estabelecimento_fotos")
      .select("id", { count: "exact", head: true })
      .eq("estabelecimento_id", estabelecimento.id),
    estabelecimento.plano_plataforma_id
      ? supabase
          .from("planos_plataforma")
          .select("max_fotos")
          .eq("id", estabelecimento.plano_plataforma_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const limite = estabelecimento.plano_plataforma_id ? (plano?.max_fotos ?? null) : LIMITE_FOTOS_SEM_PLANO;
  const usadas = fotosAtivas ?? 0;
  if (limite !== null && usadas >= limite) {
    return { error: `Limite de fotos do plano atingido (${limite}). Faça upgrade de plano para adicionar mais.` };
  }
  if (limite !== null && arquivos.length > limite - usadas) {
    return {
      error: `Você selecionou ${arquivos.length} fotos, mas só há espaço para mais ${limite - usadas} (limite do plano: ${limite}).`,
    };
  }

  let ordem = fotosTotal ?? 0;
  for (const arquivo of arquivos) {
    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${estabelecimento.id}/galeria/${crypto.randomUUID()}.${extensao}`;

    const { error: uploadError } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      contentType: arquivo.type,
    });
    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(caminho);

    const { error: insertError } = await supabase.from("estabelecimento_fotos").insert({
      estabelecimento_id: estabelecimento.id,
      url: publicUrl,
      ordem: ordem++,
    });
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/app/configuracoes");
  revalidatePath(`/b/${estabelecimento.slug}`);
  return undefined;
}

export async function removerFoto(fotoId: string): Promise<{ error?: string }> {
  const { estabelecimento } = await getEstabelecimentoAtivo();
  const supabase = await createClient();

  const { data: foto } = await supabase
    .from("estabelecimento_fotos")
    .select("id, url")
    .eq("id", fotoId)
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!foto) return { error: "Foto não encontrada." };

  const { error } = await supabase.from("estabelecimento_fotos").delete().eq("id", fotoId);
  if (error) return { error: error.message };

  const caminho = foto.url.split("/logos/")[1];
  if (caminho) await supabase.storage.from("logos").remove([caminho]);

  revalidatePath("/app/configuracoes");
  revalidatePath(`/b/${estabelecimento.slug}`);
  return {};
}

const schemaMembro = z.object({
  nome: z.string().trim().min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  email: z.email({ error: "Informe um e-mail válido." }),
});

export type ConvidarMembroState = { error?: string; aviso?: string } | undefined;

export async function convidarMembro(
  _prevState: ConvidarMembroState,
  formData: FormData
): Promise<ConvidarMembroState> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode convidar usuários." };

  const parsed = schemaMembro.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();

  const [{ count: usuariosAtuais }, { data: plano }] = await Promise.all([
    supabase
      .from("membros_estabelecimento")
      .select("id", { count: "exact", head: true })
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("ativo", true),
    estabelecimento.plano_plataforma_id
      ? supabase
          .from("planos_plataforma")
          .select("max_usuarios")
          .eq("id", estabelecimento.plano_plataforma_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const limite = estabelecimento.plano_plataforma_id ? plano?.max_usuarios ?? null : LIMITE_USUARIOS_SEM_PLANO;
  if (limite !== null && (usuariosAtuais ?? 0) >= limite) {
    return {
      error: `Limite de usuários do plano atingido (${limite}). Faça upgrade de plano para adicionar mais.`,
    };
  }

  const serviceRole = createServiceRoleClient();
  const { data: convidado, error: inviteError } = await serviceRole.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { nome: parsed.data.nome },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/definir-senha`,
    }
  );
  let usuarioId: string;
  let aviso: string | undefined;

  if (inviteError) {
    // E-mail já é um usuário existente (ex: removido da equipe antes — a conta auth não é
    // apagada, só o vínculo). inviteUserByEmail só funciona pra e-mail novo, então reativa o
    // vínculo em vez de tentar criar de novo.
    if (!inviteError.message.toLowerCase().includes("already been registered")) {
      return { error: `Erro ao convidar: ${inviteError.message}` };
    }

    const { data: lista, error: listaError } = await serviceRole.auth.admin.listUsers({ perPage: 1000 });
    const usuarioExistente = listaError
      ? undefined
      : lista.users.find((u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase());
    if (!usuarioExistente) {
      return { error: `Erro ao convidar: ${inviteError.message}` };
    }
    usuarioId = usuarioExistente.id;

    const { data: jaMembro } = await supabase
      .from("membros_estabelecimento")
      .select("id")
      .eq("estabelecimento_id", estabelecimento.id)
      .eq("usuario_id", usuarioId)
      .maybeSingle();
    if (jaMembro) return { error: "Esse usuário já faz parte da equipe." };

    aviso =
      'Esse e-mail já tinha uma conta (ex: removido da equipe antes) — vínculo reativado. Se a pessoa ainda não tem senha definida, oriente a usar "Esqueci minha senha" na tela de login.';
  } else {
    usuarioId = convidado.user.id;
  }

  const { error: membroError } = await supabase.from("membros_estabelecimento").insert({
    estabelecimento_id: estabelecimento.id,
    usuario_id: usuarioId,
    papel: "staff",
  });
  if (membroError) return { error: membroError.message };

  revalidatePath("/app/configuracoes");
  return aviso ? { aviso } : undefined;
}

export async function removerMembro(membroId: string): Promise<{ error?: string }> {
  const { estabelecimento, papel, userId } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode remover usuários." };

  const supabase = await createClient();
  const { data: membro } = await supabase
    .from("membros_estabelecimento")
    .select("id, usuario_id, papel")
    .eq("id", membroId)
    .eq("estabelecimento_id", estabelecimento.id)
    .single();
  if (!membro) return { error: "Usuário não encontrado." };
  if (membro.papel === "owner" || membro.usuario_id === userId) {
    return { error: "Não é possível remover o dono do estabelecimento." };
  }

  const { error } = await supabase.from("membros_estabelecimento").delete().eq("id", membroId);
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes");
  return {};
}

const schemaPagamento = z
  .object({
    gatewayAtivo: z.enum(["nenhum", "mercado_pago", "asaas"]),
    aceitaPagamentoAntecipado: z.boolean(),
    aceitaPagamentoNoDia: z.boolean(),
    mercadoPagoAccessToken: z.string().trim().optional(),
    mercadoPagoPublicKey: z.string().trim().optional(),
    mercadoPagoWebhookSecret: z.string().trim().optional(),
    asaasApiKey: z.string().trim().optional(),
  })
  .refine((v) => v.aceitaPagamentoAntecipado || v.aceitaPagamentoNoDia, {
    error: "Marque ao menos uma forma de pagamento.",
  });

export async function salvarConfigPagamento(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { estabelecimento, papel } = await getEstabelecimentoAtivo();
  if (papel !== "owner") return { error: "Somente o dono do estabelecimento pode alterar isso." };

  const parsed = schemaPagamento.safeParse({
    gatewayAtivo: formData.get("gatewayAtivo"),
    aceitaPagamentoAntecipado: formData.get("aceitaPagamentoAntecipado") === "on",
    aceitaPagamentoNoDia: formData.get("aceitaPagamentoNoDia") === "on",
    mercadoPagoAccessToken: formData.get("mercadoPagoAccessToken") || undefined,
    mercadoPagoPublicKey: formData.get("mercadoPagoPublicKey") || undefined,
    mercadoPagoWebhookSecret: formData.get("mercadoPagoWebhookSecret") || undefined,
    asaasApiKey: formData.get("asaasApiKey") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("estabelecimento_pagamento_config")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .maybeSingle();

  const { error } = await supabase.from("estabelecimento_pagamento_config").upsert(
    {
      estabelecimento_id: estabelecimento.id,
      gateway_ativo: parsed.data.gatewayAtivo,
      aceita_pagamento_antecipado: parsed.data.aceitaPagamentoAntecipado,
      aceita_pagamento_no_dia: parsed.data.aceitaPagamentoNoDia,
      mercado_pago_access_token: parsed.data.mercadoPagoAccessToken || atual?.mercado_pago_access_token || null,
      mercado_pago_public_key: parsed.data.mercadoPagoPublicKey || atual?.mercado_pago_public_key || null,
      mercado_pago_webhook_secret:
        parsed.data.mercadoPagoWebhookSecret || atual?.mercado_pago_webhook_secret || null,
      asaas_api_key: parsed.data.asaasApiKey || atual?.asaas_api_key || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "estabelecimento_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/app/configuracoes");
  return undefined;
}
