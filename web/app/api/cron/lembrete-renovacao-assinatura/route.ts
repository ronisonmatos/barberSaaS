import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { enviarEmail } from "@/lib/email";
import { enviarTemplateWhatsapp } from "@/lib/whatsapp";

const DIAS_ANTECEDENCIA = 3;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(Date.now() + DIAS_ANTECEDENCIA * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: candidatas } = await supabase
    .from("assinaturas_clientes")
    .select(
      "id, ciclo_fim, clientes(nome, email, telefone), estabelecimentos(nome, slug, estabelecimento_whatsapp_config(ativo, phone_number_id, access_token, nome_template_lembrete, idioma_template)), planos_estabelecimento(nome, preco_centavos)"
    )
    .eq("status", "ativa")
    .is("lembrete_renovacao_enviado_em", null)
    .gte("ciclo_fim", hoje)
    .lte("ciclo_fim", limite);

  let enviadosEmail = 0;
  let enviadosWhatsapp = 0;
  let semCanal = 0;

  for (const a of candidatas ?? []) {
    const nomeEstabelecimento = a.estabelecimentos?.nome ?? "Comptus";
    const nomePlano = a.planos_estabelecimento?.nome ?? "de assinatura";
    const slug = a.estabelecimentos?.slug;
    const linkRenovar = slug ? `${process.env.NEXT_PUBLIC_APP_URL}/b/${slug}/clube` : process.env.NEXT_PUBLIC_APP_URL;
    const dataFormatada = new Date(`${a.ciclo_fim}T00:00:00`).toLocaleDateString("pt-BR");

    let enviouAlgum = false;

    const email = a.clientes?.email;
    if (email) {
      try {
        await enviarEmail({
          para: email,
          nomeRemetente: nomeEstabelecimento,
          assunto: `Seu plano em ${nomeEstabelecimento} vence em breve`,
          html: `
            <p>Olá, ${a.clientes?.nome ?? ""}!</p>
            <p>Seu plano <strong>${nomePlano}</strong> em <strong>${nomeEstabelecimento}</strong> vence em <strong>${dataFormatada}</strong>.</p>
            <p>Pra continuar aproveitando sem interromper, renove pelo link abaixo:</p>
            <p><a href="${linkRenovar}">${linkRenovar}</a></p>
          `,
        });
        enviadosEmail++;
        enviouAlgum = true;
      } catch {
        // Falha pontual de envio (ex: Resend fora do ar) -- tenta de novo no proximo dia.
      }
    }

    const whatsappConfig = a.estabelecimentos?.estabelecimento_whatsapp_config;
    const telefone = a.clientes?.telefone;
    if (whatsappConfig?.ativo && whatsappConfig.phone_number_id && whatsappConfig.access_token && telefone) {
      try {
        await enviarTemplateWhatsapp({
          phoneNumberId: whatsappConfig.phone_number_id,
          accessToken: whatsappConfig.access_token,
          paraE164: telefone,
          nomeTemplate: whatsappConfig.nome_template_lembrete,
          idioma: whatsappConfig.idioma_template,
          parametrosCorpo: [nomeEstabelecimento, nomePlano, dataFormatada],
        });
        enviadosWhatsapp++;
        enviouAlgum = true;
      } catch {
        // Template nao aprovado, credencial invalida, etc -- nao bloqueia o e-mail, so nao conta
        // como enviado por esse canal.
      }
    }

    if (enviouAlgum) {
      await supabase
        .from("assinaturas_clientes")
        .update({ lembrete_renovacao_enviado_em: new Date().toISOString() })
        .eq("id", a.id);
    } else {
      semCanal++;
    }
  }

  return NextResponse.json({
    candidatas: candidatas?.length ?? 0,
    enviados_email: enviadosEmail,
    enviados_whatsapp: enviadosWhatsapp,
    sem_canal_ou_falha: semCanal,
  });
}
