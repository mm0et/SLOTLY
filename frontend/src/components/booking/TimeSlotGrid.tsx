"use client";

import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types";

interface Props {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (hora: string) => void;
  loading?: boolean;
  fecha: string;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect, loading, fecha }: Props) {
  const fechaObj = new Date(fecha + "T00:00:00");
  const diaNum = fechaObj.toLocaleDateString("es-ES", { day: "numeric" });
  const diaNombre = fechaObj.toLocaleDateString("es-ES", { weekday: "long" });
  const mesNombre = fechaObj.toLocaleDateString("es-ES", { month: "long" });

  const disponibles = slots.filter((s) => s.disponible);

  const manana = disponibles.filter((s) => parseInt(s.hora) < 12);
  const mediodia = disponibles.filter((s) => { const h = parseInt(s.hora); return h >= 12 && h < 15; });
  const tarde = disponibles.filter((s) => parseInt(s.hora) >= 15);

  const grupos = [
    { label: "Mañana", slots: manana, emoji: "🌅" },
    { label: "Mediodía", slots: mediodia, emoji: "☀️" },
    { label: "Tarde", slots: tarde, emoji: "🌆" },
  ].filter((g) => g.slots.length > 0);

  return (
    <div className="h-full flex flex-col">

      {/* Fecha elegida — destacada */}
      <div className="mb-6 text-center">
        <p className="text-5xl font-bold font-display text-white leading-none">{diaNum}</p>
        <p className="text-sm font-semibold text-gold-400 capitalize mt-1">{diaNombre}</p>
        <p className="text-xs text-neutral-500 capitalize mt-0.5">{mesNombre}</p>
        <div className="mx-auto mt-3 h-px w-10 bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      </div>

      {/* Slots */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-wider text-neutral-600">Buscando…</span>
        </div>
      ) : disponibles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold text-neutral-400">Sin disponibilidad</p>
          <p className="text-xs text-neutral-600">Elige otra fecha</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
          {grupos.map(({ label, slots: gSlots }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-600 mb-2">
                {label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {gSlots.map((slot) => {
                  const sel = selectedSlot === slot.hora;
                  return (
                    <button
                      key={slot.hora}
                      onClick={() => onSelect(slot.hora)}
                      className={cn(
                        "py-3 rounded-xl text-sm font-semibold border transition-all duration-300 cursor-pointer",
                        sel
                          ? "bg-gold-400 border-gold-400 text-neutral-950 shadow-md shadow-gold-400/20"
                          : "bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:border-gold-400/30 hover:bg-gold-400/[0.06] hover:text-gold-400",
                      )}
                    >
                      {slot.hora}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
