// Tipos TypeScript que reflejan los modelos Prisma del backend

// ===== ENUMS =====
export type Role = "ADMIN" | "STAFF";
export type BookingStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" | "NO_SHOW";
export type ReminderType = "CONFIRMACION" | "RECORDATORIO_24H" | "RECORDATORIO_1H";
export type ReminderChannel = "EMAIL" | "WHATSAPP" | "SMS";

// ===== MODELOS =====
export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Role;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  nombre: string;
  duracion: number; // minutos
  precio: number;
  buffer: number;
  color: string;
  activo: boolean;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  fecha: string;
  fechaFin: string;
  estado: BookingStatus;
  notas: string | null;
  customerId: string;
  serviceId: string;
  userId: string | null;
  googleEventId: string | null;
  createdAt: string;
  updatedAt: string;
  // Relaciones (incluidas cuando el backend las devuelve)
  customer?: Pick<Customer, "id" | "nombre" | "apellidos" | "telefono" | "email">;
  service?: Pick<Service, "id" | "nombre" | "duracion" | "color">;
  user?: Pick<User, "id" | "nombre">;
}

export interface AvailabilityRule {
  id: string;
  diaSemana: number; // 0=domingo ... 6=sábado
  horaInicio: string; // "09:00"
  horaFin: string;    // "20:00"
  activo: boolean;
  userId: string | null;
}

export interface TimeSlot {
  hora: string;       // "09:00"
  disponible: boolean;
}

export interface SlotsResponse {
  fecha: string;
  serviceId: string;
  slots: TimeSlot[];
}

// ===== PAYLOADS (requests) =====
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
}

export interface CreateBookingPayload {
  fecha: string; // ISO datetime
  customerId: string;
  serviceId: string;
  userId?: string | null;
  notas?: string | null;
}

export interface CreateCustomerPayload {
  nombre: string;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
}

// ===== RESPONSES =====
export interface AuthResponse {
  token: string;
  user: Pick<User, "id" | "email" | "nombre" | "rol">;
}

export interface ApiError {
  error: string;
  detalles?: { campo: string; mensaje: string }[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
