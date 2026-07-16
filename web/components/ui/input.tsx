import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ error = false, className = "", ...props }: InputProps) {
  const borderClass = error ? "border-erro" : "border-linha";

  return (
    <input
      className={`h-11 rounded-sm border ${borderClass} bg-marfim-2 px-3 text-carvao placeholder:text-cinza-300 focus:border-latao focus:outline-none focus:ring-2 focus:ring-latao/30 ${className}`.trim()}
      {...props}
    />
  );
}
