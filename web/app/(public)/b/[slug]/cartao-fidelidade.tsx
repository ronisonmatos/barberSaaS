import { ROTULO_SECAO } from "./estilos";

export type FidelidadeStatusPublico = {
  cartaoId: string;
  programaNome: string;
  brinde: string;
  selosAtual: number;
  selosNecessarios: number;
  status: "em_andamento" | "completo" | "resgatado";
};

export function CartaoFidelidadePublico({ cartoes }: { cartoes: FidelidadeStatusPublico[] }) {
  if (cartoes.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className={ROTULO_SECAO}>Fidelidade</p>
      {cartoes.map((c) => (
        <div
          key={c.cartaoId}
          className="flex flex-col gap-2 rounded-xl border-2 border-tenant-acento bg-tenant-acento/5 p-4"
        >
          <p className="font-medium text-tenant-fg">{c.programaNome}</p>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: c.selosNecessarios }, (_, i) => (
              <span
                key={i}
                className={
                  i < c.selosAtual
                    ? "h-3.5 w-3.5 shrink-0 rounded-full bg-tenant-acento"
                    : "h-3.5 w-3.5 shrink-0 rounded-full border border-tenant-linha"
                }
              />
            ))}
          </div>
          <p className="text-sm text-tenant-fg opacity-70">
            {c.selosAtual} de {c.selosNecessarios} — brinde: {c.brinde}
          </p>
          {c.status === "completo" && (
            <p className="text-sm font-medium text-tenant-acento">
              Cartão completo! Avise a equipe para retirar seu prêmio.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
