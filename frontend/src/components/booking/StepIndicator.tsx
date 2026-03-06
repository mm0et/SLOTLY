"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              {/* Círculo */}
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                  done && "bg-gold-400 text-neutral-950 shadow-lg shadow-gold-400/25",
                  active && "bg-neutral-800 text-gold-400 ring-2 ring-gold-400/30 scale-110",
                  !done && !active && "border border-neutral-700 text-neutral-600 bg-transparent"
                )}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              {/* Etiqueta */}
              <span
                className={cn(
                  "text-[10px] font-semibold font-body uppercase tracking-widest transition-colors duration-300",
                  done || active ? "text-neutral-300" : "text-neutral-600",
                  active && "font-bold"
                )}
              >
                {label}
              </span>
            </div>

            {/* Línea conectora */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-10 sm:w-14 h-px mx-2 mb-6 transition-all duration-500",
                  i < currentStep ? "bg-gold-400/60" : "bg-neutral-800"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
