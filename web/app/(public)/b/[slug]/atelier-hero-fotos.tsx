"use client";

import { useEffect, useState } from "react";

type Foto = { id: string; url: string };

export function AtelierHeroFotos({ fotos, inicial }: { fotos: Foto[]; inicial: string }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (fotos.length < 2) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % fotos.length), 5000);
    return () => clearInterval(id);
  }, [fotos.length]);

  if (fotos.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="font-display text-8xl text-tenant-acento/90">{inicial}</span>
      </div>
    );
  }

  return (
    <>
      {fotos.map((f, i) => (
        /* eslint-disable-next-line @next/next/no-img-element -- foto em bucket público, sem necessidade de otimização do next/image */
        <img
          key={f.id}
          src={f.url}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === indice ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
