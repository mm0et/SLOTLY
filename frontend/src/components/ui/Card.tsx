import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, selected, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all duration-300",
        "bg-neutral-900 border-neutral-800",
        hover && "cursor-pointer hover:-translate-y-1 hover:border-gold-400/30 hover:shadow-lg hover:shadow-gold-400/5",
        selected && "border-gold-400/40 ring-2 ring-gold-400/20 bg-gold-400/5 shadow-[0_0_20px_rgba(200,169,126,0.1)]",
        !selected && !hover && "shadow-none",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </div>
  );
}
