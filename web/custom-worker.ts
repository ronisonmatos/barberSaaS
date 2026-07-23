// Worker de entrada customizado, exigido pelo OpenNext pra adicionar um handler de Cron Trigger
// (Cloudflare não faz requisicao HTTP pro proprio worker num agendamento -- ele chama um export
// `scheduled()` separado). O `fetch` continua sendo o handler gerado pelo Next.js normalmente;
// `scheduled()` so descobre quais rotas de cron correspondem ao horario que disparou (via
// `event.cron`, que bate com o que esta em wrangler.jsonc -> triggers.crons) e invoca elas
// internamente, sem sair pra rede de verdade.
//
// So 2 horarios de trigger (nao 1 por rota): o plano gratuito da Cloudflare permite so 3 Cron
// Triggers por worker. Os 5 jobs diarios (que dependem so de data, nao de hora do dia) rodam
// todos as 5h, em sequencia -- a ordem entre lembrete-renovacao-assinatura e
// expirar-assinaturas-clube importa (avisar antes de cortar), entao preservada.
//
// Excluido do tsconfig/eslint do app (so existe depois de `opennextjs-cloudflare build`, que
// gera .open-next/worker.js, e depende de tipos globais do workerd que so existem com
// cloudflare-env.d.ts gerado -- que por sua vez conflita com os tipos de fetch/Response do resto
// do app se deixado presente). Validado via `npm run preview` (build + wrangler local), nao pelo
// typecheck do Next.js.
import { default as handler } from "./.open-next/worker.js";

const ROTAS_POR_CRON = {
  "*/5 * * * *": ["/api/cron/expirar-pendentes"],
  "0 5 * * *": [
    "/api/cron/gerar-horarios-fixos",
    "/api/cron/expirar-trial",
    "/api/cron/lembrete-renovacao-assinatura",
    "/api/cron/expirar-assinaturas-clube",
    "/api/cron/expirar-rascunhos",
  ],
};

const cronWorker = {
  fetch: handler.fetch,

  async scheduled(event, env, ctx) {
    const rotas = ROTAS_POR_CRON[event.cron];
    if (!rotas) return;

    for (const rota of rotas) {
      const request = new Request(`${env.NEXT_PUBLIC_APP_URL}${rota}`, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
      const resposta = await handler.fetch(request, env, ctx);
      if (!resposta.ok) {
        console.error(`cron ${rota} retornou status ${resposta.status}`);
      }
    }
  },
};

export default cronWorker;
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
