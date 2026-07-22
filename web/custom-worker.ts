// Worker de entrada customizado, exigido pelo OpenNext pra adicionar um handler de Cron Trigger
// (Cloudflare não faz requisicao HTTP pro proprio worker num agendamento -- ele chama um export
// `scheduled()` separado). O `fetch` continua sendo o handler gerado pelo Next.js normalmente;
// `scheduled()` so descobre qual rota de cron corresponde ao horario que disparou (via
// `event.cron`, que bate com o que esta em wrangler.jsonc -> triggers.crons) e invoca ela
// internamente, sem sair pra rede de verdade.
//
// Excluido do tsconfig/eslint do app (so existe depois de `opennextjs-cloudflare build`, que
// gera .open-next/worker.js, e depende de tipos globais do workerd que so existem com
// cloudflare-env.d.ts gerado -- que por sua vez conflita com os tipos de fetch/Response do resto
// do app se deixado presente). Validado via `npm run preview` (build + wrangler local), nao pelo
// typecheck do Next.js.
import { default as handler } from "./.open-next/worker.js";

const ROTA_POR_CRON = {
  "*/5 * * * *": "/api/cron/expirar-pendentes",
  "0 5 * * *": "/api/cron/gerar-horarios-fixos",
  "0 6 * * *": "/api/cron/expirar-trial",
  "30 6 * * *": "/api/cron/lembrete-renovacao-assinatura",
  "0 7 * * *": "/api/cron/expirar-assinaturas-clube",
  "0 8 * * *": "/api/cron/expirar-rascunhos",
};

const cronWorker = {
  fetch: handler.fetch,

  async scheduled(event, env, ctx) {
    const rota = ROTA_POR_CRON[event.cron];
    if (!rota) return;

    const request = new Request(`${env.NEXT_PUBLIC_APP_URL}${rota}`, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const resposta = await handler.fetch(request, env, ctx);
    if (!resposta.ok) {
      console.error(`cron ${rota} retornou status ${resposta.status}`);
    }
  },
};

export default cronWorker;
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
