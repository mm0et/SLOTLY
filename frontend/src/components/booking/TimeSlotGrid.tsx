"use client";

import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types";
import { Clock } from "lucide-react";

interface Props {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (hora: string) => void;
  loading?: boolean;
  fecha: string;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect, loading, fecha }: Props) {
  const fechaObj = new Date(fecha + "T00:00:00");
  const opcionesFecha: Intl.DateTimeFormatOptions = {
    weekday: "long", day: "numeric", month: "long",
  };
  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", opcionesFecha);

  const slotsDisponibles = slots.filter((s) => s.disponible);

  // Agrupar por franja: Mañana (< 12), Mediodía (12-15), Tarde (15+)
  const mañana = slots.filter((s) => {
    const h = parseInt(s.hora.split(":")[0]);
    return h < 12;
  });
  const mediodia = slots.filter((s) => {
    const h = parseInt(s.hora.split(":")[0]);
    return h >= 12 && h < 15;
  });
  const tarde = slots.filter((s) => {
    const h = parseInt(s.hora.split(":")[0]);
    return h >= 15;
  });

  const renderGroup = (label: string, groupSlots: TimeSlot[]) => {
    if (groupSlots.length === 0) return null;
    return (
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          {label}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {groupSlots.map((slot) => {
            const seleccionado = selectedSlot === slot.hora;
            return (
              <button
                key={slot.hora}
                onClick={() => slot.disponible && onSelect(slot.hora)}
                disabled={!slot.disponible}
                className={cn(
                  "py-3.5 px-2 rounded-xl text-sm font-semibold border transition-all duration-300",
                  slot.disponible && !seleccionado &&
                    "bg-neutral-900/70 border-neutral-800/50 text-neutral-300 hover:border-gold-400/30 hover:bg-neutral-900 hover:-translate-y-0.5 cursor-pointer",
                  !slot.disponible &&
                    "bg-neutral-900/30 border-neutral-800/30 text-neutral-700 cursor-not-allowed line-through opacity-30",
                  seleccionado &&
                    "bg-gold-400 border-gold-400 text-neutral-950 font-bold shadow-lg shadow-gold-400/25"
                )}
              >
                {slot.hora}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
          Elige tu hora
        </h2>
        <p className="mt-2 text-sm text-neutral-500 capitalize">
          {fechaFormateada}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Buscando horarios...
          </p>
        </div>
      ) : slotsDisponibles.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Clock size={32} className="text-neutral-600 mx-auto" />
          <p className="text-base font-semibold text-white">
            No hay horas disponibles
          </p>
          <p className="text-sm text-neutral-500">
            Prueba con otro día
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup("Mañana", mañana)}
          {renderGroup("Mediodía", mediodia)}
          {renderGroup("Tarde", tarde)}
        </div>
      )}
    </div>
  );
}
