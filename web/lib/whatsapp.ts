import "server-only";

/**
 * Envio de mensagem via WhatsApp Cloud API (Meta), fetch direto sem SDK -- mesmo padrão já usado
 * pra Mercado Pago/Asaas/Resend. Credenciais são sempre do próprio estabelecimento (phone_number_id
 * + access_token), nunca compartilhadas pela plataforma.
 *
 * Só envia MENSAGEM DE TEMPLATE, nunca texto livre: fora de uma janela de atendimento de 24h
 * (que é sempre o caso aqui -- são avisos que o estabelecimento inicia, não uma resposta a uma
 * mensagem do cliente), a WhatsApp Business Platform só aceita templates pré-aprovados pela Meta.
 * Cada estabelecimento precisa ter criado e aprovado o próprio template no Meta Business Manager
 * antes de usar isso.
 */
export async function enviarTemplateWhatsapp(input: {
  phoneNumberId: string;
  accessToken: string;
  paraE164: string;
  nomeTemplate: string;
  idioma: string;
  parametrosCorpo: string[];
}): Promise<{ messageId: string | null }> {
  const paraSemMais = input.paraE164.replace(/^\+/, "");

  const resposta = await fetch(`https://graph.facebook.com/v21.0/${input.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: paraSemMais,
      type: "template",
      template: {
        name: input.nomeTemplate,
        language: { code: input.idioma },
        components:
          input.parametrosCorpo.length > 0
            ? [{ type: "body", parameters: input.parametrosCorpo.map((texto) => ({ type: "text", text: texto })) }]
            : undefined,
      },
    }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Falha ao enviar WhatsApp (${resposta.status}): ${texto}`);
  }

  const dados = (await resposta.json()) as { messages?: { id: string }[] };
  return { messageId: dados.messages?.[0]?.id ?? null };
}
