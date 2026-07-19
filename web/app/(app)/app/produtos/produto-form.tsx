"use client";

import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import { salvarProduto } from "./actions";
import { slugify } from "@/lib/slug";
import { centavosParaCampoBRL } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";

type Produto = Database["public"]["Tables"]["produtos"]["Row"];

function Secao({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-linha pt-4 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm font-medium text-carvao">{titulo}</p>
        {ajuda && <p className="text-xs text-cinza-600">{ajuda}</p>}
      </div>
      {children}
    </div>
  );
}

export function ProdutoForm({
  produto,
  estabelecimentoSlug,
  onDone,
}: {
  produto?: Produto | null;
  estabelecimentoSlug: string;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(salvarProduto, undefined);

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [fotoPreview, setFotoPreview] = useState<string | null>(produto?.foto_url ?? null);
  const [tags, setTags] = useState<string[]>(produto?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [slug, setSlug] = useState(produto?.slug ?? "");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(Boolean(produto?.slug));
  const [metaTitulo, setMetaTitulo] = useState(produto?.meta_titulo ?? "");
  const [metaDescricao, setMetaDescricao] = useState(produto?.meta_descricao ?? "");

  useEffect(() => {
    return () => {
      if (fotoPreview && fotoPreview.startsWith("blob:")) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setFotoPreview(URL.createObjectURL(arquivo));
  }

  function handleNome(valor: string) {
    setNome(valor);
    if (!slugEditadoManualmente) setSlug(slugify(valor));
  }

  function adicionarTag() {
    const valor = tagInput.trim();
    if (valor && !tags.includes(valor)) setTags((prev) => [...prev, valor]);
    setTagInput("");
  }

  function removerTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  const tituloBusca = metaTitulo || nome || "Título do produto";
  const descricaoBusca = metaDescricao || "A descrição de busca aparece aqui conforme você digita.";

  return (
    <form
      action={async (formData) => {
        formData.set("tags", tags.join(","));
        await action(formData);
        onDone?.();
      }}
      className="flex flex-col gap-5 rounded-md border border-linha bg-marfim-2 p-4"
    >
      {produto && <input type="hidden" name="id" value={produto.id} />}

      <Secao titulo="Informações básicas">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">Nome</label>
            <Input name="nome" required value={nome} onChange={(e) => handleNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Preço (R$)</label>
            <Input
              name="preco"
              required
              defaultValue={produto ? centavosParaCampoBRL(produto.preco_centavos) : ""}
              placeholder="40,00"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Estoque</label>
            <Input name="estoque" type="number" min={0} required defaultValue={produto?.estoque ?? 0} />
            <p className="text-xs text-cinza-600">Quantidade disponível para venda agora.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="ativo" defaultChecked={produto?.ativo ?? true} />
          Ativo (aparece na loja pública)
        </label>
      </Secao>

      <Secao titulo="Foto e descrição">
        <div className="flex items-start gap-3">
          {fotoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element -- preview local (blob) ou foto já enviada */
            <img src={fotoPreview} alt="" className="h-20 w-20 shrink-0 rounded-md border border-linha object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-linha text-xs text-cinza-600">
              Sem foto
            </div>
          )}
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium">Foto do produto</label>
            <input
              type="file"
              name="foto"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFoto}
            />
            <p className="text-xs text-cinza-600">PNG, JPEG, WEBP ou SVG, até 5MB.</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            name="descricao"
            defaultValue={produto?.descricao ?? ""}
            rows={3}
            placeholder="Conte o que é o produto, ingredientes, tamanho..."
            className="rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao placeholder:text-cinza-300 focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          />
        </div>
      </Secao>

      <Secao titulo="Organização" ajuda="Tags ajudam a agrupar produtos parecidos na vitrine.">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-marfim px-3 py-1 text-xs text-carvao"
            >
              {tag}
              <button
                type="button"
                onClick={() => removerTag(tag)}
                aria-label={`Remover tag ${tag}`}
                className="text-cinza-600 hover:text-erro"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: pomada, cabelo (Enter para adicionar)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                adicionarTag();
              }
            }}
          />
          <Button type="button" variant="secondary" className="shrink-0 text-sm" onClick={adicionarTag}>
            Adicionar
          </Button>
        </div>
      </Secao>

      <Secao titulo="SEO" ajuda="Como esse produto aparece no Google, na sua própria página pública.">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">URL do produto</label>
          <div className="flex items-center gap-1 text-sm text-cinza-600">
            <span className="shrink-0">/b/{estabelecimentoSlug}/loja/</span>
            <input
              name="slugPersonalizado"
              value={slug}
              onChange={(e) => {
                setSlugEditadoManualmente(true);
                setSlug(slugify(e.target.value));
              }}
              className="min-w-0 flex-1 rounded-sm border border-linha bg-marfim-2 px-2 py-1 text-carvao focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Título de busca</label>
            <span className="text-xs text-cinza-600">{metaTitulo.length}/60</span>
          </div>
          <Input
            name="metaTitulo"
            maxLength={60}
            placeholder={nome || "Deixe em branco para usar o nome do produto"}
            value={metaTitulo}
            onChange={(e) => setMetaTitulo(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Descrição de busca</label>
            <span className="text-xs text-cinza-600">{metaDescricao.length}/155</span>
          </div>
          <textarea
            name="metaDescricao"
            maxLength={155}
            rows={2}
            placeholder="Resumo curto que aparece embaixo do título nos resultados do Google."
            value={metaDescricao}
            onChange={(e) => setMetaDescricao(e.target.value)}
            className="rounded-sm border border-linha bg-marfim-2 px-3 py-2 text-carvao placeholder:text-cinza-300 focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30"
          />
        </div>

        <div className="rounded-md border border-linha bg-marfim p-3">
          <p className="mb-1 text-xs text-cinza-600">Como aparece no Google</p>
          <p className="truncate text-[15px] text-latao-escuro">{tituloBusca}</p>
          <p className="truncate text-xs text-sucesso">
            comptus.com.br/b/{estabelecimentoSlug}/loja/{slug || "produto"}
          </p>
          <p className="line-clamp-2 text-sm text-cinza-600">{descricaoBusca}</p>
        </div>
      </Secao>

      {state?.error && <FormError>{state.error}</FormError>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {produto && (
          <Button type="button" variant="secondary" onClick={onDone} className="text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
