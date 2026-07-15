"use client";

import { useActionState, useState } from "react";
import { criarBarbearia } from "./actions";
import { slugify } from "@/lib/slug";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(criarBarbearia, undefined);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-sm font-medium">
          Nome da barbearia
        </label>
        <input
          id="nome"
          name="nome"
          required
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (!slugEditadoManualmente) setSlug(slugify(e.target.value));
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Endereço da página pública
        </label>
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <span>/b/</span>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugEditadoManualmente(true);
              setSlug(slugify(e.target.value));
            }}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "Criando..." : "Criar barbearia"}
      </button>
    </form>
  );
}
