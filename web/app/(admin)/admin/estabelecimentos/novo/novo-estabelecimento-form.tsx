"use client";

import { useActionState, useState } from "react";
import { cadastrarEstabelecimentoManualmente } from "./actions";
import { slugify } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function NovoEstabelecimentoForm() {
  const [state, action, pending] = useActionState(cadastrarEstabelecimentoManualmente, undefined);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

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

      <div className="flex flex-col gap-1">
        <label htmlFor="nomeDono" className="text-sm font-medium">
          Nome do dono
        </label>
        <Input id="nomeDono" name="nomeDono" required />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="emailDono" className="text-sm font-medium">
          E-mail do dono
        </label>
        <Input id="emailDono" name="emailDono" type="email" required />
      </div>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending}>
        {pending ? "Cadastrando..." : "Cadastrar e enviar convite"}
      </Button>
    </form>
  );
}
