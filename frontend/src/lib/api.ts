import type {
  Service,
  SlotsResponse,
  Customer,
  Booking,
  CreateBookingPayload,
  CreateCustomerPayload,
  AuthResponse,
  LoginPayload,
  HealthResponse,
  AvailabilityRule,
} from "./types";

// ===== BASE =====
const API_BASE = "/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Error de conexión" }));
      throw new ApiRequestError(res.status, body.error || "Error desconocido", body.detalles);
    }

    return res.json();
  }

  // ===== HEALTH =====
  health() {
    return this.request<HealthResponse>("/health");
  }

  // ===== AUTH =====
  async login(data: LoginPayload): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  logout() {
    this.setToken(null);
  }

  me() {
    return this.request<{ user: AuthResponse["user"] }>("/auth/me");
  }

  // ===== SERVICES (público) =====
  getServices() {
    return this.request<Service[]>("/services");
  }

  getService(id: string) {
    return this.request<Service>(`/services/${id}`);
  }

  createService(data: Partial<Service>) {
    return this.request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateService(id: string, data: Partial<Service>) {
    return this.request<Service>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteService(id: string) {
    return this.request<{ ok: boolean }>(`/services/${id}`, { method: "DELETE" });
  }

  // ===== AVAILABILITY =====
  getAvailabilityRules() {
    return this.request<AvailabilityRule[]>("/availability/rules");
  }

  getSlots(fecha: string, serviceId: string) {
    return this.request<SlotsResponse>(
      `/availability/slots?fecha=${fecha}&serviceId=${serviceId}`
    );
  }

  // ===== CUSTOMERS =====
  getCustomers() {
    return this.request<Customer[]>("/customers");
  }

  createCustomer(data: CreateCustomerPayload) {
    return this.request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===== BOOKINGS =====
  getBookings(params?: { desde?: string; hasta?: string; estado?: string }) {
    const query = new URLSearchParams();
    if (params?.desde) query.set("desde", params.desde);
    if (params?.hasta) query.set("hasta", params.hasta);
    if (params?.estado) query.set("estado", params.estado);
    const qs = query.toString();
    return this.request<Booking[]>(`/bookings${qs ? `?${qs}` : ""}`);
  }

  getBooking(id: string) {
    return this.request<Booking>(`/bookings/${id}`);
  }

  createBooking(data: CreateBookingPayload) {
    return this.request<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateBookingStatus(id: string, estado: string) {
    return this.request<Booking>(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  }

  cancelBooking(id: string) {
    return this.request<{ ok: boolean }>(`/bookings/${id}`, { method: "DELETE" });
  }

  // ===== GOOGLE CALENDAR =====
  calendarStatus() {
    return this.request<{ configurado: boolean; conectado: boolean; calendarId: string | null; mensaje: string }>("/calendars/status");
  }

  calendarConnect() {
    return this.request<{ authUrl: string }>("/calendars/connect");
  }

  calendarDisconnect() {
    return this.request<{ ok: boolean; mensaje: string }>("/calendars/disconnect", { method: "POST" });
  }
}

// ===== ERROR TIPADO =====
export class ApiRequestError extends Error {
  status: number;
  detalles?: { campo: string; mensaje: string }[];

  constructor(status: number, message: string, detalles?: { campo: string; mensaje: string }[]) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.detalles = detalles;
  }
}

// ===== SINGLETON =====
export const api = new ApiClient();

// ===== DEMO API — devuelve datos simulados sin backend =====
import {
  DEMO_SERVICES,
  DEMO_CUSTOMER,
  generateDemoSlots,
  createDemoBooking,
} from "./demo-data";

export const demoApi = {
  getToken: () => null,
  setToken: () => {},
  logout: () => {},

  getServices: () => Promise.resolve([...DEMO_SERVICES]),
  getService: (id: string) => Promise.resolve(DEMO_SERVICES.find((s) => s.id === id)!),

  getSlots: (fecha: string, serviceId: string) =>
    Promise.resolve(generateDemoSlots(fecha, serviceId)),

  createCustomer: (_data: any) => Promise.resolve({ ...DEMO_CUSTOMER }),

  createBooking: (data: any) =>
    new Promise<any>((resolve) =>
      setTimeout(() => resolve(createDemoBooking(data.fecha, data.serviceId)), 800)
    ),

  // Los siguientes no se usan en el flujo público de demo
  getCustomers: () => Promise.resolve([]),
  getBookings: () => Promise.resolve([]),
  getBooking: (_id: string) => Promise.resolve(null as any),
  updateBookingStatus: (_id: string, _estado: string) => Promise.resolve(null as any),
  cancelBooking: (_id: string) => Promise.resolve({ ok: true }),
  getAvailabilityRules: () => Promise.resolve([]),
  createService: (_d: any) => Promise.resolve(null as any),
  updateService: (_id: string, _d: any) => Promise.resolve(null as any),
  deleteService: (_id: string) => Promise.resolve({ ok: true }),
  calendarStatus: () => Promise.resolve({ configurado: false, conectado: false, calendarId: null, mensaje: "Demo mode" }),
  calendarConnect: () => Promise.resolve({ authUrl: "" }),
  calendarDisconnect: () => Promise.resolve({ ok: true, mensaje: "Demo mode" }),
  login: (_d: any) => Promise.resolve(null as any),
  me: () => Promise.resolve(null as any),
  health: () => Promise.resolve({ status: "ok" as const, timestamp: new Date().toISOString() }),
};
