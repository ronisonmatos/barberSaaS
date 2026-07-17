export function BrandFooter({ variant = "full" }: { variant?: "full" | "powered-by" }) {
  const ano = new Date().getFullYear();

  if (variant === "powered-by") {
    return (
      <p className="text-center text-xs text-cinza-600">
        Powered by <span className="font-medium">Comptus</span> · © {ano} · Todos os direitos
        reservados.
      </p>
    );
  }

  return (
    <p className="text-center text-xs text-cinza-600">
      © {ano} Comptus. Todos os direitos reservados.
    </p>
  );
}
