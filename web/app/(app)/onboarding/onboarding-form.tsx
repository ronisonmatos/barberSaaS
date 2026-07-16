"use client";

import { useActionState, useState } from "react";
import { criarEstabelecimento } from "./actions";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

const TEMAS = [
  { valor: "classica", label: "Clássica", desc: "Barbearia tradicional", bg: "#17191C", fg: "#F4F2ED", acento: "#C9A15C" },
  { valor: "moderna", label: "Moderna", desc: "Barbearia/estúdio jovem", bg: "#F4F2ED", fg: "#17191C", acento: "#17191C" },
  { valor: "delicada", label: "Delicada", desc: "Salão de beleza", bg: "#FAF7F4", fg: "#3A3330", acento: "#B4826E" },
] as const;

export function OnboardingForm() {
  const [state, action, pending] = useActionState(criarEstabelecimento, undefined);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [tema, setTema] = useState<(typeof TEMAS)[number]["valor"]>("classica");

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
            className="flex-1 text-carvao"
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
              <span
                className="flex h-10 w-full items-center justify-center rounded-sm"
                style={{ background: t.bg }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: t.acento }} />
              </span>
              <span className="text-xs font-medium text-carvao">{t.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-cinza-600">{TEMAS.find((t) => t.valor === tema)?.desc}</p>
        <input type="hidden" name="tema" value={tema} />
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar estabelecimento"}
      </Button>
    </form>
  );
}
