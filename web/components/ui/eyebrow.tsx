import type { HTMLAttributes } from "react";

type EyebrowProps = HTMLAttributes<HTMLParagraphElement>;

export function Eyebrow({ className = "", ...props }: EyebrowProps) {
  return <p className={`fio text-xs uppercase tracking-[0.14em] text-latao-escuro ${className}`.trim()} {...props} />;
}
