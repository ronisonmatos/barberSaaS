import "server-only";

/**
 * Envio de e-mail via Resend (fetch direto, sem SDK, mesmo padrão já usado pra Mercado
 * Pago/Asaas). Precisa de RESEND_API_KEY e RESEND_FROM_EMAIL configurados -- o remetente
 * (endereço) é sempre o mesmo domínio verificado na Comptus; `nomeRemetente` deixa o "de" com a
 * cara do estabelecimento (ex: "Clube do Homem <notificacoes@comptus...>"), já que o e-mail é
 * sobre a assinatura do cliente com aquele estabelecimento específico, não com a Comptus.
 */
export async function enviarEmail(input: {
  para: string;
  assunto: string;
  html: string;
  nomeRemetente?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const enderecoRemetente = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !enderecoRemetente) {
    throw new Error("Envio de e-mail não configurado (RESEND_API_KEY/RESEND_FROM_EMAIL ausente).");
  }

  const from = input.nomeRemetente ? `${input.nomeRemetente} <${enderecoRemetente}>` : enderecoRemetente;

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: input.para, subject: input.assunto, html: input.html }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Falha ao enviar e-mail (${resposta.status}): ${texto}`);
  }
}
