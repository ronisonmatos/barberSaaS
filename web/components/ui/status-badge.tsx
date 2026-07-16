import type { LucideIcon } from "lucide-react";
import { Clock, Check, CheckCheck, X, UserX } from "lucide-react";

export type StatusAgendamento = "pendente" | "confirmado" | "concluido" | "cancelado" | "no_show";

const STATUS_CONFIG: Record<StatusAgendamento, { label: string; icon: LucideIcon; className: string }> = {
  pendente: { label: "Pendente", icon: Clock, className: "text-aviso" },
  confirmado: { label: "Confirmado", icon: Check, className: "text-latao-escuro" },
  concluido: { label: "Concluído", icon: CheckCheck, className: "text-sucesso" },
  cancelado: { label: "Cancelado", icon: X, className: "text-cinza-600" },
  no_show: { label: "Não compareceu", icon: UserX, className: "text-erro" },
};

export function StatusBadge({ status }: { status: StatusAgendamento }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {label}
    </span>
  );
}
