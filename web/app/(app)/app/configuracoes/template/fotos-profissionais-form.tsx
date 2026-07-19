"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarFotoProfissional } from "@/app/(app)/app/profissionais/actions";
import { FormError } from "@/components/ui/form-error";

type Profissional = { id: string; nome: string; fotoUrl: string | null };

export function FotosProfissionaisForm({ profissionais }: { profissionais: Profissional[] }) {
  const router = useRouter();
  const [fotos, setFotos] = useState<Record<string, string | null>>(
    Object.fromEntries(profissionais.map((p) => [p.id, p.fotoUrl]))
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function subirFoto(profissionalId: string, arquivo: File) {
    setErros((e) => ({ ...e, [profissionalId]: "" }));
    setFotos((f) => ({ ...f, [profissionalId]: URL.createObjectURL(arquivo) }));
    setPendentes((p) => new Set(p).add(profissionalId));

    startTransition(async () => {
      const formData = new FormData();
      formData.set("foto", arquivo);
      const r = await atualizarFotoProfissional(profissionalId, formData);
      setPendentes((p) => {
        const novo = new Set(p);
        novo.delete(profissionalId);
        return novo;
      });
      if (r.error) {
        setErros((e) => ({ ...e, [profissionalId]: r.error! }));
        return;
      }
      router.refresh();
    });
  }

  if (profissionais.length === 0) {
    return <p className="text-sm text-cinza-600">Cadastre profissionais primeiro em Profissionais.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {profissionais.map((p) => (
        <div key={p.id} className="flex items-center gap-3">
          {fotos[p.id] ? (
            /* eslint-disable-next-line @next/next/no-img-element -- imagem em bucket público */
            <img src={fotos[p.id]!} alt="" className="size-12 rounded-full border border-linha object-cover" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full border border-linha text-xs text-cinza-600">
              {p.nome.slice(0, 1)}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-sm font-medium text-carvao">{p.nome}</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) subirFoto(p.id, arquivo);
              }}
              className="text-xs"
            />
            {pendentes.has(p.id) && <p className="text-xs text-cinza-600">Enviando...</p>}
            {erros[p.id] && <FormError className="text-xs">{erros[p.id]}</FormError>}
          </div>
        </div>
      ))}
    </div>
  );
}
