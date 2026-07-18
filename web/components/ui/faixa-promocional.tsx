// Faixa diagonal de canto: a largura da tira (w) precisa ser MAIOR que a diagonal do quadrado
// de recorte (lado * raiz de 2), nao so igual -- se for exatamente igual, as pontas caem
// bem em cima do canto do quadrado, sem folga, e qualquer arredondamento de pixel do navegador
// deixa uma pontinha visivel dos dois lados. A margem extra (MARGEM) garante que as pontas
// fiquem seguramente PASSADO do canto (escondidas de verdade), nao so tangentes a ele.
const LADO = 130;        // px, lado do quadrado de recorte
const ALTURA_TIRA = 26;  // px
const DIST = 45;         // px, distância do centro da faixa ao canto (por eixo)
                         // a faixa cruza as bordas a 2*DIST (90px) do canto
// comprimento mínimo p/ cobrir o triângulo: 2*DIST*√2 + ALTURA ≈ 153
const LARGURA_TIRA = 180;

const TOPO = Math.round(DIST - ALTURA_TIRA / 2);      // 32
const DIREITA = Math.round(DIST - LARGURA_TIRA / 2);  // -45

export function FaixaPromocional({ texto }: { texto: string }) {
  return (
    <div
      className="pointer-events-none absolute top-0 right-0 overflow-hidden"
      style={{ width: LADO, height: LADO }}
      aria-hidden="true"
    >
      <div
        className="absolute flex rotate-45 items-center justify-center truncate whitespace-nowrap bg-latao text-center text-[11px] font-medium tracking-wide text-carvao uppercase shadow-[0_1px_2px_rgb(0_0_0_/_0.2)]"
        style={{ top: TOPO, right: DIREITA, width: LARGURA_TIRA, height: ALTURA_TIRA }}
      >
        {texto}
      </div>
    </div>
  );
}
