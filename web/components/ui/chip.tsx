import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function Chip({ selected = false, className = "", ...props }: ChipProps) {
  // Chip é usado na página pública (tema por tenant), por isso segue as cores --tenant-*
  // em vez das cores fixas do painel — precisa continuar legível em qualquer preset.
  const estado = selected
    ? "border-tenant-acento bg-tenant-acento text-tenant-acento-fg"
    : "border-tenant-linha bg-transparent text-current hover:border-tenant-acento";

  return (
    <button
      type="button"
      className={`rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-acento focus-visible:ring-offset-2 ${estado} ${className}`.trim()}
      {...props}
    />
  );
}
