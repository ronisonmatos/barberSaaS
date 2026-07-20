"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import type { InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: boolean;
};

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative w-full">
      <Input {...props} type={visivel ? "text" : "password"} className={`w-full pr-10 ${className}`.trim()} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-cinza-600 hover:text-carvao focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-latao focus-visible:ring-offset-2"
      >
        {visivel ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
      </button>
    </div>
  );
}
