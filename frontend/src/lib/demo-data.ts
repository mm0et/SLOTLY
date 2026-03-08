// ===== DATOS DEMO — no hace llamadas reales al backend =====
// Activo cuando NEXT_PUBLIC_DEMO_MODE=true

import type { Service, SlotsResponse, Customer, Booking } from "./types";

// ===== SERVICIOS DEMO =====
export const DEMO_SERVICES: Service[] = [
  {
    id: "demo-1",
    nombre: "Corte de pelo",
    duracion: 30,
    precio: 18,
    buffer: 5,
    color: "#c8a97e",
    activo: true,
    descripcion: "Corte clásico o moderno adaptado a tu estilo",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-2",
    nombre: "Arreglo de barba",
    duracion: 20,
    precio: 12,
    buffer: 5,
    color: "#a07850",
    activo: true,
    descripcion: "Perfilado y arreglo profesional de barba",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-3",
    nombre: "Corte + Barba",
    duracion: 50,
    precio: 28,
    buffer: 5,
    color: "#e94560",
    activo: true,
    descripcion: "Pack completo: corte de pelo y arreglo de barba",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-4",
    nombre: "Afeitado clásico",
    duracion: 30,
    precio: 20,
    buffer: 5,
    color: "#8b7355",
    activo: true,
    descripcion: "Afeitado tradicional con navaja y toalla caliente",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-5",
    nombre: "Tratamiento capilar",
    duracion: 45,
    precio: 35,
    buffer: 10,
    color: "#6b8e6b",
    activo: true,
    descripcion: "Hidratación y tratamiento intensivo del cabello",
    createdAt: "",
    updatedAt: "",
  },
];

// ===== SLOTS DEMO — genera horarios realistas para cualquier día =====
export function generateDemoSlots(fecha: string, serviceId: string): SlotsResponse {
  const service = DEMO_SERVICES.find((s) => s.id === serviceId);
  const duracion = service ? service.duracion + service.buffer : 35;

  // Bloqueamos algunos huecos aleatorios pero deterministas por fecha para que parezca real
  const seed = fecha.split("-").reduce((acc, n) => acc + parseInt(n), 0);
  const bloqueados = new Set([
    (seed % 8) + 2,
    (seed % 5) + 6,
    (seed % 3) + 10,
  ]);

  const slots: { hora: string; disponible: boolean }[] = [];
  let cursor = 9 * 60; // 09:00
  const limite = 20 * 60; // 20:00
  let idx = 0;

  while (cursor + (service?.duracion ?? 30) <= limite) {
    const h = String(Math.floor(cursor / 60)).padStart(2, "0");
    const m = String(cursor % 60).padStart(2, "0");
    slots.push({ hora: `${h}:${m}`, disponible: !bloqueados.has(idx) });
    cursor += duracion;
    idx++;
  }

  return { fecha, serviceId, slots };
}

// ===== BOOKING DEMO — simulado =====
export function createDemoBooking(fecha: string, serviceId: string): Booking {
  const service = DEMO_SERVICES.find((s) => s.id === serviceId)!;
  const fechaDate = new Date(fecha);
  const fechaFin = new Date(fechaDate.getTime() + (service?.duracion ?? 30) * 60000);

  return {
    id: `demo-${Date.now()}`,
    fecha: fechaDate.toISOString(),
    fechaFin: fechaFin.toISOString(),
    estado: "CONFIRMADA",
    notas: null,
    customerId: "demo-customer",
    serviceId,
    userId: null,
    googleEventId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { id: "demo-customer", nombre: "Cliente", apellidos: "Demo", telefono: null, email: "demo@slotly.app", notas: null, createdAt: "", updatedAt: "" },
    service: { ...service },
    user: null,
    reminders: [],
  } as any;
}

// ===== CUSTOMER DEMO =====
export const DEMO_CUSTOMER: Customer = {
  id: "demo-customer",
  nombre: "Cliente",
  apellidos: "Demo",
  telefono: "600000000",
  email: "demo@slotly.app",
  notas: null,
  createdAt: "",
  updatedAt: "",
};

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
