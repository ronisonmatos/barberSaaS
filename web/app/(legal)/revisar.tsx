// JSX não tem sintaxe nativa para comentário HTML (<!-- -->) -- {/* */} é comentário
// de JS/JSX e some no build, não aparece no HTML renderizado. Este componente emite
// um comentário HTML de verdade (via dangerouslySetInnerHTML, seguro aqui porque o
// conteúdo é sempre estático/escrito por nós, nunca vindo de usuário) para marcar
// trechos que precisam de revisão jurídica antes do lançamento, além de um destaque
// visível na própria página.
export function Revisar({ children }: { children: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: `<!-- REVISAR --><mark style="background:#B98A2E33;color:#17191C;padding:0 4px;border-radius:3px;font-weight:500">${children}</mark>`,
      }}
    />
  );
}
