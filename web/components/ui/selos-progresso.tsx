export function SelosProgresso({ atual, total }: { atual: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="img" aria-label={`${atual} de ${total} selos`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i < atual
              ? "h-3.5 w-3.5 shrink-0 rounded-full bg-latao"
              : "h-3.5 w-3.5 shrink-0 rounded-full border border-linha"
          }
        />
      ))}
    </div>
  );
}
