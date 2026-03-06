import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  PENDIENTE:  { label: "Pendiente",  bg: "#fef3c7", text: "#92400e" },
  CONFIRMADA: { label: "Confirmada", bg: "#d1fae5", text: "#065f46" },
  CANCELADA:  { label: "Cancelada",  bg: "#fee2e2", text: "#991b1b" },
  COMPLETADA: { label: "Completada", bg: "#dbeafe", text: "#1e40af" },
  NO_SHOW:    { label: "No Show",    bg: "#f3f4f6", text: "#374151" },
};

interface BadgeProps {
  status: BookingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
        className
      )}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
