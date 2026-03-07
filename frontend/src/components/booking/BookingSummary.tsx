"use client";

import type { Service } from "@/lib/types";
import type { CustomerData } from "./CustomerForm";
import { Calendar, Clock, User, Scissors } from "lucide-react";

interface Props {
  service: Service;
  fecha: string;
  hora: string;
  customer: CustomerData;
}

export function BookingSummary({ service, fecha, hora, customer }: Props) {
  const fechaObj = new Date(fecha + "T00:00:00");
  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [h, m] = hora.split(":").map(Number);
  const finMin = h * 60 + m + service.duracion;
  const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, "0")}:${String(finMin % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
          Resumen de tu cita
        </h3>
        <span className="text-lg font-bold font-display text-gold-400">
          {service.precio.toFixed(2)} €
        </span>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="space-y-3">
        <SummaryRow
          icon={<Scissors size={14} />}
          label="Servicio"
          value={service.nombre}
        />
        <SummaryRow
          icon={<Calendar size={14} />}
          label="Fecha"
          value={fechaFormateada}
        />
        <SummaryRow
          icon={<Clock size={14} />}
          label="Hora"
          value={`${hora} — ${horaFin} (${service.duracion} min)`}
        />
        {(customer.nombre || customer.apellidos) && (
          <SummaryRow
            icon={<User size={14} />}
            label="Cliente"
            value={[customer.nombre, customer.apellidos]
              .filter(Boolean)
              .join(" ")}
          />
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-gold-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-white/40">
          {label}
        </p>
        <p className="text-sm font-medium capitalize text-white">{value}</p>
      </div>
    </div>
  );
}
