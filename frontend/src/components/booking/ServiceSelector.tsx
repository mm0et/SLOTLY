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

/* ── Marquee items ── */
const MARQUEE = [
  "Corte de pelo",
  "Arreglo de barba",
  "Corte y barba",
  "Premium",
  "Mantenimiento",
  "Afeitado clásico",
  "Ritual capilar",
  "Diseño de barba",
];

interface Props {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ services, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-10">
      {/* ── Service cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {services.map((service, i) => {
          const Icon = getServiceIcon(service.nombre);
          const selected = selectedId === service.id;

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "animate-fade-in-up group relative rounded-2xl flex flex-col items-center text-center cursor-pointer",
                "p-7 sm:p-8",
                "border transition-all duration-500 ease-out",
                selected
                  ? "bg-gold-400/[0.06] border-gold-400/30 shadow-lg shadow-gold-400/5"
                  : "bg-neutral-900/70 border-neutral-800/50 hover:border-neutral-700/60 hover:bg-neutral-900/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20",
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Indicador de selección */}
              {selected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gold-400 flex items-center justify-center animate-scale-in">
                  <Check size={14} strokeWidth={3} className="text-neutral-950" />
                </div>
              )}

              {/* Icono en círculo dorado */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-500",
                  selected
                    ? "bg-gold-400/20"
                    : "bg-gold-400/[0.08] group-hover:bg-gold-400/15",
                )}
              >
                <Icon
                  size={26}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-colors duration-300",
                    selected
                      ? "text-gold-400"
                      : "text-gold-400/80 group-hover:text-gold-400",
                  )}
                />
              </div>

              {/* Nombre */}
              <h3
                className={cn(
                  "text-lg sm:text-xl font-bold text-white mb-2 transition-colors duration-300",
                  selected && "text-gold-100",
                )}
              >
                {service.nombre}
              </h3>

              {/* Descripción */}
              {service.descripcion && (
                <p className="text-[13px] sm:text-sm leading-relaxed text-neutral-400 mb-5 flex-1">
                  {service.descripcion}
                </p>
              )}

              {/* Precio + duración */}
              <div className="flex items-center gap-2.5 mb-6">
                <span className="text-gold-400 font-bold text-lg">
                  {service.precio.toFixed(2).replace(".00", "")} €
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-500 text-sm">
                  {service.duracion} min
                </span>
              </div>

              {/* Etiqueta RESERVAR (visual, no funcional — el botón es toda la tarjeta) */}
              <span
                className={cn(
                  "w-full py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-[0.15em]",
                  "transition-all duration-300 ease-out",
                  "flex items-center justify-center gap-2",
                  selected
                    ? "bg-gold-400 text-neutral-950 shadow-md shadow-gold-400/20"
                    : "border border-gold-400/30 text-gold-400 group-hover:bg-gold-400 group-hover:text-neutral-950 group-hover:border-gold-400 group-hover:shadow-md group-hover:shadow-gold-400/20",
                )}
              >
                {selected ? "Seleccionado" : "Reservar"}
                {!selected && <ArrowRight size={14} strokeWidth={2.5} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Marquee decorativo ── */}
      <div className="overflow-hidden border-y border-neutral-800/40 py-5 -mx-4 sm:-mx-6">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-600 flex items-center gap-8 px-4"
            >
              {item}
              <span className="text-gold-400/40">✦</span>
            </span>
          ))}
        </div>
      </div>

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
