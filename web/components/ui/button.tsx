import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "perigo";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "h-11 rounded-md bg-latao px-4 font-medium text-carvao hover:bg-latao-escuro disabled:opacity-50",
  secondary:
    "h-11 rounded-md border border-linha bg-transparent px-4 font-medium text-carvao hover:bg-marfim-2 disabled:opacity-50",
  ghost: "text-cinza-600 underline hover:text-carvao disabled:opacity-50",
  perigo: "text-erro underline hover:opacity-80 disabled:opacity-50",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2 ${VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
