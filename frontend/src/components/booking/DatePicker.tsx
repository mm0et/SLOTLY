"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  availableDays?: number[];
  compact?: boolean;
}

const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const DIAS_FULL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function DatePicker({ selectedDate, onSelect, availableDays, compact = false }: Props) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primerDia = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offsetInicio = primerDia.getDay();

  const irAnterior = () => { if (mes === 0) { setMes(11); setAnio(anio - 1); } else setMes(mes - 1); };
  const irSiguiente = () => { if (mes === 11) { setMes(0); setAnio(anio + 1); } else setMes(mes + 1); };

  const formatDate = (dia: number) =>
    `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const esDisponible = (dia: number) => {
    const fecha = new Date(anio, mes, dia);
    if (fecha < hoy) return false;
    if (!availableDays) return true;
    return availableDays.includes(fecha.getDay());
  };

  const puedeMesAnterior = anio > hoy.getFullYear() || mes > hoy.getMonth();
  const hoyStr = formatDate(hoy.getDate());
  const labels = compact ? DIAS : DIAS_FULL;

  return (
    <div className="w-full select-none">

      {/* Mes / Año */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={irAnterior}
          disabled={!puedeMesAnterior}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-gold-400 hover:bg-gold-400/[0.08] transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        <h3 className={cn(
          "font-bold font-display text-white tracking-wide",
          compact ? "text-lg" : "text-2xl sm:text-3xl"
        )}>
          {MESES[mes]}{" "}
          <span className={cn("font-light text-neutral-500", compact ? "text-base" : "text-xl")}>
            {anio}
          </span>
        </h3>

        <button
          onClick={irSiguiente}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-gold-400 hover:bg-gold-400/[0.08] transition-all duration-300 cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Separador */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-4" />

      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-1">
        {labels.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest py-2 text-neutral-600">
            {d}
          </div>
        ))}
      </div>

      {/* Grid días */}
      <div className={cn("grid grid-cols-7", compact ? "gap-0.5" : "gap-1 sm:gap-1.5")}>
        {Array.from({ length: offsetInicio }).map((_, i) => <div key={`e-${i}`} />)}

        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1;
          const dateStr = formatDate(dia);
          const disponible = esDisponible(dia);
          const seleccionado = selectedDate === dateStr;
          const esHoy = dateStr === hoyStr;

          return (
            <button
              key={dia}
              onClick={() => disponible && onSelect(dateStr)}
              disabled={!disponible}
              className={cn(
                "aspect-square flex items-center justify-center font-medium rounded-xl transition-all duration-300",
                compact ? "text-xs" : "text-sm sm:text-base",
                disponible && !seleccionado &&
                  "cursor-pointer text-neutral-200 hover:bg-gold-400/10 hover:text-gold-400",
                !disponible &&
                  "text-neutral-700 opacity-25 cursor-not-allowed",
                seleccionado &&
                  "bg-gold-400 text-neutral-950 font-bold shadow-lg shadow-gold-400/25",
                esHoy && !seleccionado &&
                  "text-gold-400 font-bold ring-1 ring-gold-400/40",
              )}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
