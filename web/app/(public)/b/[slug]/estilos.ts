// Estilos compartilhados entre as telas públicas do estabelecimento (home, agendar). Usam as
// cores --tenant-* (variam por preset do tenant) em vez da paleta fixa do painel.
export const BOTAO_PRIMARIO =
  "inline-flex h-11 items-center justify-center rounded-md bg-tenant-acento px-4 text-sm font-medium text-tenant-acento-fg transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";
export const BOTAO_SECUNDARIO =
  "inline-flex h-11 items-center justify-center rounded-md border border-tenant-linha px-4 text-sm font-medium text-current transition-colors duration-150 hover:border-tenant-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2";
export const BOTAO_GHOST = "text-sm text-current underline opacity-70 hover:opacity-100";
export const ROTULO_SECAO = "text-xs font-bold uppercase tracking-[0.08em] text-tenant-acento";

// Moldura do card único (layout "1A Clássico") usada em toda a família /b/{slug} — home,
// agendar e meus-agendamentos — para todas ficarem visualmente consistentes.
export const PAGINA_WRAP = "min-h-screen px-4 py-10";
export const PAGINA_CARTAO =
  "mx-auto w-full max-w-[480px] overflow-hidden rounded-[20px] bg-tenant-bg-2 text-tenant-fg shadow-xl";
