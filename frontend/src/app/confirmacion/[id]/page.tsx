"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { Button } from "@/components/ui";
import { CheckCircle, Calendar, Clock, Scissors, User, Phone, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ConfirmacionPage() {
  const params = useParams();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getBooking(id)
      .then(setBooking)
      .catch(() => setError("No se encontró la reserva"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Cargando reserva...
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bark-950">
        <div className="text-center space-y-6">
          <p className="text-lg font-semibold text-red-400">
            {error || "Reserva no encontrada"}
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft size={14} /> Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const fechaObj = new Date(booking.fecha);
  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const horaInicio = fechaObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const fechaFinObj = new Date(booking.fechaFin);
  const horaFin = fechaFinObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen flex flex-col bg-bark-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-bark-900 border-b border-neutral-800/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        <div className="relative z-10 py-10 px-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto bg-gold-400/15 border-2 border-gold-400/40 animate-scale-in">
            <CheckCircle size={28} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-white">
              ¡Reserva confirmada!
            </h1>
            <p className="text-[11px] mt-2 uppercase tracking-widest text-neutral-500">
              Te esperamos el día de tu cita
            </p>
          </div>
        </div>
      </div>

      {/* Detalles */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md space-y-6 animate-fade-in-up">
          {/* Card de detalles */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-5">
            {booking.service && (
              <DetailRow
                icon={<Scissors size={14} />}
                label="Servicio"
                value={booking.service.nombre}
                highlight
              />
            )}
            <DetailRow
              icon={<Calendar size={14} />}
              label="Fecha"
              value={fechaFormateada}
            />
            <DetailRow
              icon={<Clock size={14} />}
              label="Hora"
              value={`${horaInicio} — ${horaFin}`}
            />
            {booking.customer && (
              <>
                <DetailRow
                  icon={<User size={14} />}
                  label="Cliente"
                  value={[booking.customer.nombre, booking.customer.apellidos].filter(Boolean).join(" ")}
                />
                {booking.customer.telefono && (
                  <DetailRow
                    icon={<Phone size={14} />}
                    label="Teléfono"
                    value={booking.customer.telefono}
                  />
                )}
                {booking.customer.email && (
                  <DetailRow
                    icon={<Mail size={14} />}
                    label="Email"
                    value={booking.customer.email}
                  />
                )}
              </>
            )}
          </div>

          {/* Código */}
          <div className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-600">
              Código de reserva
            </p>
            <p className="text-xs font-mono font-bold px-4 py-2.5 inline-block rounded-lg bg-neutral-800 text-neutral-300 tracking-wider">
              {booking.id}
            </p>
          </div>

          {/* CTA */}
          <Link href="/" className="block">
            <Button variant="primary" size="lg" className="w-full">
              Reservar otra cita
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-neutral-800/50 bg-bark-900">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
          © {new Date().getFullYear()} Muerte o Gloria Barbershop
        </p>
      </footer>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-gold-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p
          className={`text-sm font-medium capitalize ${
            highlight ? "text-gold-400 font-display" : "text-white font-body"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
