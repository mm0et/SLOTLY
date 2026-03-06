"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  availableDays?: number[];
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function DatePicker({ selectedDate, onSelect, availableDays }: Props) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const offsetInicio = primerDia.getDay();

  const irAnterior = () => {
    if (mes === 0) { setMes(11); setAnio(anio - 1); }
    else setMes(mes - 1);
  };

  const irSiguiente = () => {
    if (mes === 11) { setMes(0); setAnio(anio + 1); }
    else setMes(mes + 1);
  };

  const esPasado = (dia: number) => {
    const fecha = new Date(anio, mes, dia);
    return fecha < hoy;
  };

  const esDisponible = (dia: number) => {
    if (esPasado(dia)) return false;
    if (!availableDays) return true;
    const fecha = new Date(anio, mes, dia);
    return availableDays.includes(fecha.getDay());
  };

  const formatDate = (dia: number) => {
    const m = String(mes + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    return `${anio}-${m}-${d}`;
  };

  const puedeMesAnterior = anio > hoy.getFullYear() || mes > hoy.getMonth();

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
          ¿Qué día prefieres?
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Selecciona una fecha disponible
        </p>
      </div>

      {/* Calendario contenedor */}
      <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800/50 p-6 sm:p-8">
        {/* Cabecera mes/año */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={irAnterior}
            disabled={!puedeMesAnterior}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-gold-400 hover:bg-gold-400/[0.08] transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-lg font-bold font-display text-white tracking-wide">
            {MESES[mes]} {anio}
          </h3>
          <button
            onClick={irSiguiente}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-gold-400 hover:bg-gold-400/[0.08] transition-all duration-300 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Cabecera días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DIAS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold uppercase tracking-wider py-2 text-neutral-600"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offsetInicio }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1;
            const dateStr = formatDate(dia);
            const disponible = esDisponible(dia);
            const seleccionado = selectedDate === dateStr;
            const esHoy = dateStr === formatDate(hoy.getDate()) && mes === hoy.getMonth() && anio === hoy.getFullYear();

            return (
              <button
                key={dia}
                onClick={() => disponible && onSelect(dateStr)}
                disabled={!disponible}
                className={cn(
                  "aspect-square flex items-center justify-center text-sm font-medium rounded-full transition-all duration-300",
                  disponible && !seleccionado && "cursor-pointer text-neutral-300 hover:bg-gold-400/[0.08] hover:text-gold-400",
                  !disponible && "text-neutral-700 opacity-30 cursor-not-allowed",
                  seleccionado && "bg-gold-400 text-neutral-950 font-bold shadow-lg shadow-gold-400/25",
                  esHoy && !seleccionado && "text-gold-400 font-bold ring-1 ring-gold-400/40"
                )}
              >
                {dia}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
