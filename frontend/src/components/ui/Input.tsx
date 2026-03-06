"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-4 py-3 text-sm rounded-xl font-body transition-all duration-300",
          "bg-neutral-800/50 border border-neutral-700 text-white",
          "placeholder:text-neutral-500",
          "outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400/40",
          error && "ring-2 ring-red-500/40 border-red-500/40",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-red-400">{error}</p>
      )}
    </div>
  );
}
