# BarberSaaS

SaaS multi-tenant para barbearias e salões de beleza. Ver `ORIENTACAO-BARBERSAAS.md` para a
especificação completa (arquitetura, modelo de dados, regras de negócio e roadmap).

## Estrutura

- `web/` — Next.js (App Router) + TypeScript + Tailwind. Os três painéis (público, estabelecimento, admin).
- `supabase/` — migrations SQL, seed e Edge Functions.

## Setup local

```bash
cd web
npm install
npm run dev
```

Variáveis de ambiente em `web/.env.local` (ver `web/.env.local.example`).

## Banco de dados

O schema é versionado em `supabase/migrations/`. O projeto Supabase já está linkado
(`smphmeoljjgakghsnvpb`).

```bash
supabase db push                    # aplica migrations pendentes no projeto remoto
supabase db push --include-seed     # aplica migrations + seed.sql (dados de demo)
supabase gen types typescript --linked > web/lib/supabase/types.ts   # regenerar tipos
```
