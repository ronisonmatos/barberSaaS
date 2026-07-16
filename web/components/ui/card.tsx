import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`w-full rounded-md border border-linha bg-marfim-2 p-6 shadow-[0_1px_2px_rgb(0_0_0_/_0.06)] ${className}`.trim()}
      {...props}
    />
  );
}
