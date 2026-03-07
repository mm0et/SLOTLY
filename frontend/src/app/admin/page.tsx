"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/types";
import { Card, Button, StatusBadge } from "@/components/ui";
import {
  CalendarDays, Clock, User, Scissors, RefreshCw,
  ChevronDown,
} from "lucide-react";

const FILTROS_ESTADO: { label: string; value: BookingStatus | "TODAS" }[] = [
  { label: "Todas", value: "TODAS" },
  { label: "Confirmadas", value: "CONFIRMADA" },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Completadas", value: "COMPLETADA" },
  { label: "Canceladas", value: "CANCELADA" },
  { label: "No Show", value: "NO_SHOW" },
];

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<BookingStatus | "TODAS">("TODAS");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const cargarReservas = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtro !== "TODAS") params.estado = filtro;
      const data = await api.getBookings(params);
      setBookings(data);
    } catch (err) {
      console.error("Error cargando reservas:", err);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const cambiarEstado = async (id: string, nuevoEstado: BookingStatus) => {
    setUpdatingId(id);
    try {
      await api.updateBookingStatus(id, nuevoEstado);
      await cargarReservas();
    } catch (err) {
      console.error("Error actualizando estado:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats rápidas
  const hoy = new Date().toISOString().split("T")[0];
  const reservasHoy = bookings.filter((b) => b.fecha.startsWith(hoy));
  const confirmadas = bookings.filter((b) => b.estado === "CONFIRMADA").length;
  const pendientes = bookings.filter((b) => b.estado === "PENDIENTE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
            Reservas
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {bookings.length} reserva{bookings.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarReservas}>
          <RefreshCw size={14} /> Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Hoy" value={reservasHoy.length} color="var(--color-accent)" />
        <StatCard label="Confirmadas" value={confirmadas} color="var(--color-success)" />
        <StatCard label="Pendientes" value={pendientes} color="var(--color-warning)" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: filtro === f.value ? "var(--color-accent)" : "var(--color-bg)",
              color: filtro === f.value ? "#fff" : "var(--color-text-secondary)",
              border: `1px solid ${filtro === f.value ? "transparent" : "var(--color-border)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de reservas */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-border)", borderTopColor: "transparent" }}
          />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={40} className="mx-auto mb-3" style={{ color: "var(--color-border)" }} />
          <p className="font-medium" style={{ color: "var(--color-text)" }}>
            No hay reservas
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {filtro !== "TODAS" ? "Prueba con otro filtro" : "Aún no se han creado reservas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onCambiarEstado={cambiarEstado}
              updating={updatingId === booking.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTES AUXILIARES =====

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    </Card>
  );
}

function BookingRow({
  booking,
  onCambiarEstado,
  updating,
}: {
  booking: Booking;
  onCambiarEstado: (id: string, estado: BookingStatus) => void;
  updating: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const fechaObj = new Date(booking.fecha);
  const fechaStr = fechaObj.toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short",
  });
  const horaStr = fechaObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const horaFin = new Date(booking.fechaFin).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const ACCIONES = (
    [
      { label: "Confirmar", estado: "CONFIRMADA" as const },
      { label: "Completar", estado: "COMPLETADA" as const },
      { label: "No Show", estado: "NO_SHOW" as const },
      { label: "Cancelar", estado: "CANCELADA" as const },
    ] satisfies { label: string; estado: BookingStatus }[]
  ).filter((a) => a.estado !== booking.estado);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Servicio + estado */}
          <div className="flex items-center gap-2 flex-wrap">
            {booking.service && (
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: booking.service.color }}
                />
                {booking.service.nombre}
              </span>
            )}
            <StatusBadge status={booking.estado} />
          </div>

          {/* Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {booking.customer && (
              <span className="flex items-center gap-1">
                <User size={12} /> {booking.customer.nombre}
              </span>
            )}
            <span className="flex items-center gap-1 capitalize">
              <CalendarDays size={12} /> {fechaStr}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {horaStr} — {horaFin}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="relative shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            loading={updating}
          >
            Estado <ChevronDown size={14} />
          </Button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg py-1 min-w-[140px]"
                style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
              >
                {ACCIONES.map((accion) => (
                  <button
                    key={accion.estado}
                    onClick={() => {
                      onCambiarEstado(booking.id, accion.estado);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: "var(--color-text)" }}
                  >
                    {accion.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
