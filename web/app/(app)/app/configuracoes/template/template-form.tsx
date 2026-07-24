"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { centavosToBRL } from "@/lib/money";
import { salvarTemplate } from "./actions";
import { TemaCheckout } from "./tema-checkout";
import { FotosProfissionaisForm } from "./fotos-profissionais-form";
import { RitualForm } from "./ritual-form";
import { FraseCurtaForm } from "./frase-curta-form";

type TemaPremium = {
  id: string;
  chave: string;
  nome: string;
  descricao: string | null;
  precoCentavos: number;
  gratis: boolean;
  fotoPreviewUrl: string | null;
  comprado: boolean;
};

// Chaves de tema que têm edições exclusivas (além de escolher/comprar) e o que cada uma precisa.
// "prestigio" -> foto de profissional; "atelier" -> passos do ritual (ver home-atelier.tsx).
const TEM_EXTRAS = new Set(["prestigio", "atelier"]);

export function TemplateForm({
  layoutAtual,
  temasPremium,
  profissionais,
  ritualAtual,
  descricaoAtual,
  publicKey,
  email,
  gatewayAtivo,
}: {
  layoutAtual: string;
  temasPremium: TemaPremium[];
  profissionais: { id: string; nome: string; fotoUrl: string | null }[];
  ritualAtual: { titulo: string; texto: string }[];
  descricaoAtual: string | null;
  publicKey: string | null;
  email: string;
  gatewayAtivo: "mercado_pago" | "asaas";
}) {
  const [layout, setLayout] = useState(layoutAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checkoutTema, setCheckoutTema] = useState<TemaPremium | null>(null);
  const [editandoChave, setEditandoChave] = useState<string | null>(null);

  function aplicar(novoLayout: string) {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const r = await salvarTemplate({ layout: novoLayout });
      if (r.error) {
        setErro(r.error);
        return;
      }
      setLayout(novoLayout);
      setSalvo(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => aplicar("classico")}
          aria-pressed={layout === "classico"}
          className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
            layout === "classico" ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-carvao">Clássico</p>
            {layout === "classico" && <Check className="h-4 w-4 text-sucesso" strokeWidth={2} />}
          </div>
          <p className="text-xs text-cinza-600">
            Cartão único, direto ao ponto — o layout atual. Grátis, sempre disponível.
          </p>
        </button>

        {temasPremium.map((tema) => (
          <div
            key={tema.id}
            className={`flex flex-col items-start gap-2 rounded-md border p-4 ${
              layout === tema.chave ? "border-latao ring-2 ring-latao/30" : "border-linha"
            }`}
          >
            {tema.fotoPreviewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- imagem em bucket público */
              <img
                src={tema.fotoPreviewUrl}
                alt={`Prévia do template ${tema.nome}`}
                className="aspect-video w-full rounded-sm border border-linha object-cover"
              />
            ) : null}
            <div className="flex w-full items-center justify-between">
              <p className="flex items-center gap-1.5 font-medium text-carvao">
                {!tema.comprado && <Lock className="h-3.5 w-3.5 text-latao-escuro" strokeWidth={2} />}
                {tema.nome}
              </p>
              {layout === tema.chave && <Check className="h-4 w-4 text-sucesso" strokeWidth={2} />}
            </div>
            {tema.descricao && <p className="text-xs text-cinza-600">{tema.descricao}</p>}
            <div className="flex flex-wrap items-center gap-3">
              {tema.comprado ? (
                <Button
                  variant={layout === tema.chave ? "secondary" : "primary"}
                  disabled={pending || layout === tema.chave}
                  onClick={() => aplicar(tema.chave)}
                  className="text-sm"
                >
                  {layout === tema.chave ? "Em uso" : "Usar este template"}
                </Button>
              ) : (
                <Button onClick={() => setCheckoutTema(tema)} className="text-sm">
                  Comprar por {centavosToBRL(tema.precoCentavos)}
                </Button>
              )}
              {layout === tema.chave && TEM_EXTRAS.has(tema.chave) && (
                <button
                  type="button"
                  onClick={() => setEditandoChave(editandoChave === tema.chave ? null : tema.chave)}
                  className="text-sm text-latao-escuro underline"
                >
                  {editandoChave === tema.chave ? "Fechar edição" : "Editar"}
                </button>
              )}
              <a
                href={`/temas/${tema.chave}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-latao-escuro underline"
              >
                Ver demonstração
              </a>
            </div>

            {editandoChave === tema.chave && tema.chave === "prestigio" && (
              <div className="mt-2 w-full border-t border-linha pt-3">
                <p className="mb-3 text-xs text-cinza-600">
                  Esse template mostra a foto de cada profissional na home. Quem não tiver foto
                  aparece só com a inicial do nome.
                </p>
                <FotosProfissionaisForm profissionais={profissionais} />
              </div>
            )}

            {editandoChave === tema.chave && tema.chave === "atelier" && (
              <div className="mt-2 flex w-full flex-col gap-4 border-t border-linha pt-3">
                <FraseCurtaForm descricaoAtual={descricaoAtual} />
                <RitualForm passosAtuais={ritualAtual} />
              </div>
            )}
          </div>
        ))}
      </div>

      {checkoutTema && (
        <TemaCheckout
          temaId={checkoutTema.id}
          temaNome={checkoutTema.nome}
          valorCentavos={checkoutTema.precoCentavos}
          publicKey={publicKey}
          email={email}
          gatewayAtivo={gatewayAtivo}
          onFechar={() => setCheckoutTema(null)}
        />
      )}

      {erro && <FormError>{erro}</FormError>}
      {salvo && <p className="text-sm text-sucesso">Template aplicado.</p>}

      <p className="text-xs text-cinza-600">
        As cores continuam configuráveis separadamente em{" "}
        <Link href="/app/configuracoes/aparencia" className="underline hover:text-carvao">
          Aparência
        </Link>{" "}
        — funcionam com qualquer template.
      </p>
    </div>
  );
}
