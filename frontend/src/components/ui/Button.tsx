"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold font-body uppercase rounded-lg",
        "transition-all duration-300 cursor-pointer tracking-wider",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
        size === "sm" && "text-xs px-4 py-2 gap-1.5",
        size === "md" && "text-sm px-6 py-3 gap-2",
        size === "lg" && "text-sm px-8 py-4 gap-2.5",
        variant === "primary" &&
          "bg-gold-400 text-neutral-950 hover:bg-gold-300 shadow-lg shadow-gold-400/10 active:scale-[0.97] hover:-translate-y-0.5",
        variant === "secondary" &&
          "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 shadow-sm active:scale-[0.98]",
        variant === "outline" &&
          "border border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800/50 active:scale-[0.98]",
        variant === "ghost" &&
          "bg-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 active:scale-[0.98]",
        variant === "danger" &&
          "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 active:scale-[0.98]",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
