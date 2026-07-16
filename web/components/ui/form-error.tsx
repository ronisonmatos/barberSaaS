import type { HTMLAttributes } from "react";

type FormErrorProps = HTMLAttributes<HTMLParagraphElement>;

export function FormError({ className = "", ...props }: FormErrorProps) {
  return <p className={`text-sm text-erro ${className}`.trim()} {...props} />;
}
