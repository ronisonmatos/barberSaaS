import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

export function StatTile({
  label,
  value,
  icon: Icon,
  colorClassName = "text-carvao",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClassName?: string;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${colorClassName}`} strokeWidth={1.5} />
        <p className="min-w-0 break-words text-sm font-medium text-cinza-600">{label}</p>
      </div>
      <p className={`font-display text-3xl ${colorClassName}`}>{value.toLocaleString("pt-BR")}</p>
    </Card>
  );
}
