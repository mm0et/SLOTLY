"use client";

import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types";
import {
  Scissors,
  Sparkles,
  Crown,
  RefreshCw,
  SprayCan,
  ArrowRight,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Icono según servicio ── */
function getServiceIcon(nombre: string): LucideIcon {
  const n = nombre.toLowerCase();
  if (n.includes("premium")) return Crown;
  if (n.includes("mant")) return RefreshCw;
  if (n.includes("barba") && n.includes("corte")) return SprayCan;
  if (n.includes("barba")) return Sparkles;
  return Scissors;
}

interface Props {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ services, selectedId, onSelect }: Props) {
  const renderCard = (service: Service, i: number) => {
    const Icon = getServiceIcon(service.nombre);
    const selected = selectedId === service.id;
    return (
      <button
        key={service.id}
        onClick={() => onSelect(service)}
        className={cn(
          "animate-fade-in-up group relative rounded-2xl flex flex-col items-center text-center cursor-pointer",
          "w-full sm:w-72 lg:w-80",
          "p-7 sm:p-9",
                "border transition-all duration-500 ease-out",
                selected
                  ? "bg-gold-400/[0.08] border-gold-400/30 shadow-lg shadow-gold-400/10"
                  : "bg-white/[0.03] border-white/[0.08] hover:border-white/15 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20",
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Indicador de selección */}
              {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold-400 flex items-center justify-center animate-scale-in">
                  <Check size={14} strokeWidth={3} className="text-neutral-950" />
                </div>
              )}

              {/* Icono */}
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center mb-4 transition-all duration-500",
                  selected
                    ? "bg-gold-400/20"
                    : "bg-gold-400/[0.06] group-hover:bg-gold-400/10",
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-colors duration-300",
                    selected
                      ? "text-gold-400"
                      : "text-gold-400/70 group-hover:text-gold-400",
                  )}
                />
              </div>

              {/* Nombre */}
              <h3
                className={cn(
                  "text-base sm:text-lg font-bold text-white mb-1.5 transition-colors duration-300",
                  selected && "text-gold-100",
                )}
              >
                {service.nombre}
              </h3>

              {/* Descripción */}
              {service.descripcion && (
                <p className="text-[12px] sm:text-[13px] leading-relaxed text-neutral-500 mb-4 flex-1">
                  {service.descripcion}
                </p>
              )}

              {/* Precio + duración */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gold-400 font-bold text-base">
                  {service.precio.toFixed(2).replace(".00", "")} €
                </span>
                <span className="text-neutral-700">·</span>
                <span className="text-neutral-500 text-sm">
                  {service.duracion} min
                </span>
              </div>

              {/* Botón Reservar */}
              <span
                className={cn(
                  "w-full py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.15em]",
                  "transition-all duration-300 ease-out",
                  "flex items-center justify-center gap-2",
                  selected
                    ? "bg-gold-400 text-neutral-950 shadow-md shadow-gold-400/20"
                    : "border border-gold-400/25 text-gold-400/80 group-hover:bg-gold-400 group-hover:text-neutral-950 group-hover:border-gold-400 group-hover:shadow-md group-hover:shadow-gold-400/20",
                )}
              >
                {selected ? "Seleccionado" : "Reservar"}
                {!selected && <ArrowRight size={13} strokeWidth={2.5} />}
              </span>
            </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-5 sm:gap-7">
      {/* Fila 1 — primeros 3 */}
      <div className="flex flex-wrap justify-center gap-5 sm:gap-7">
        {services.slice(0, 3).map((s, i) => renderCard(s, i))}
      </div>
      {/* Fila 2 — resto centrado */}
      {services.length > 3 && (
        <div className="flex flex-wrap justify-center gap-5 sm:gap-7">
          {services.slice(3).map((s, i) => renderCard(s, i + 3))}
        </div>
      )}

      {/* Empty state */}
      {services.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-neutral-500">
            No hay servicios disponibles
          </p>
        </div>
      )}
    </div>
  );
}
