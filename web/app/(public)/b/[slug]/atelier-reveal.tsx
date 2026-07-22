"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Revela a seção (fade + slide-up) quando ela entra na viewport, template Atelier. Só liga a
 * classe "is-visible" uma vez, via IntersectionObserver -- quem pediu menos movimento já não vê
 * nada disso (a regra global de prefers-reduced-motion em globals.css zera a transition).
 */
export function AtelierReveal({
  children,
  stagger = false,
  className = "",
}: {
  children: React.ReactNode;
  stagger?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = stagger ? "atelier-reveal-stagger" : "atelier-reveal";
  return (
    <div ref={ref} className={`${base} ${visivel ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
