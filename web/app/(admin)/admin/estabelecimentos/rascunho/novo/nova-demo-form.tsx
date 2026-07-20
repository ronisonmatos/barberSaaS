"use client";

import { useActionState, useState } from "react";
import { criarPaginaDemonstracao } from "./actions";
import { slugify } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

const TEMAS = [
  { valor: "classica", label: "Clássica", bg: "#17191C", acento: "#C9A15C" },
  { valor: "moderna", label: "Moderna", bg: "#F4F2ED", acento: "#17191C" },
  { valor: "delicada", label: "Delicada", bg: "#FAF7F4", acento: "#B4826E" },
] as const;

type TemaGratisPremium = { chave: string; nome: string; descricao: string | null; fotoPreviewUrl: string | null };

export function NovaDemoForm({ temasGratisPremium }: { temasGratisPremium: TemaGratisPremium[] }) {
  const [state, action, pending] = useActionState(criarPaginaDemonstracao, undefined);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [tema, setTema] = useState<(typeof TEMAS)[number]["valor"]>("classica");
  const [layout, setLayout] = useState("classico");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-sm font-medium">
          Nome do estabelecimento
        </label>
        <Input
          id="nome"
          name="nome"
          required
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (!slugEditadoManualmente) setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Endereço da página pública
        </label>
        <div className="flex items-center gap-1 text-sm text-cinza-600">
          <span>/b/</span>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugEditadoManualmente(true);
              setSlug(slugify(e.target.value));
            }}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Tema da página pública</p>
        <div className="grid grid-cols-3 gap-2">
          {TEMAS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTema(t.valor)}
              aria-pressed={tema === t.valor}
              className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                tema === t.valor ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
              }`}
            >
              <span className="flex h-10 w-full items-center justify-center rounded-sm" style={{ background: t.bg }}>
                <span className="h-2 w-2 rounded-full" style={{ background: t.acento }} />
              </span>
              <span className="text-xs font-medium text-carvao">{t.label}</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="tema" value={tema} />
      </div>

      {temasGratisPremium.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Template da página pública</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setLayout("classico")}
              aria-pressed={layout === "classico"}
              className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                layout === "classico" ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
              }`}
            >
              <span className="text-xs font-medium text-carvao">Clássico</span>
              <span className="text-xs text-cinza-600">Cartão único, direto ao ponto.</span>
            </button>
            {temasGratisPremium.map((t) => (
              <button
                key={t.chave}
                type="button"
                onClick={() => setLayout(t.chave)}
                aria-pressed={layout === t.chave}
                className={`flex flex-col items-start gap-1.5 rounded-sm border p-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${
                  layout === t.chave ? "border-latao ring-2 ring-latao/30" : "border-linha hover:border-latao"
                }`}
              >
                {t.fotoPreviewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- imagem em bucket público */
                  <img
                    src={t.fotoPreviewUrl}
                    alt={`Prévia do template ${t.nome}`}
                    className="aspect-video w-full rounded-sm border border-linha object-cover"
                  />
                ) : null}
                <span className="text-xs font-medium text-carvao">{t.nome}</span>
                {t.descricao && <span className="text-xs text-cinza-600">{t.descricao}</span>}
              </button>
            ))}
          </div>
          <input type="hidden" name="layout" value={layout} />
        </div>
      )}
      {temasGratisPremium.length === 0 && <input type="hidden" name="layout" value="classico" />}

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar e ir para o editor"}
      </Button>
    </form>
  );
}
