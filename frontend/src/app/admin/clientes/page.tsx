"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Card } from "@/components/ui";
import { User, Phone, Mail, Search } from "lucide-react";

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = customers.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          Clientes
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {customers.length} cliente{customers.length !== 1 ? "s" : ""} registrado{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Buscar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-secondary)" }}
        />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2"
          style={{
            backgroundColor: "var(--color-bg)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-border)", borderTopColor: "transparent" }}
          />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16">
          <User size={40} className="mx-auto mb-3" style={{ color: "var(--color-border)" }} />
          <p className="font-medium" style={{ color: "var(--color-text)" }}>
            {busqueda ? "Sin resultados" : "No hay clientes"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {busqueda ? "Prueba con otra búsqueda" : "Los clientes aparecerán cuando reserven"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  {c.nombre.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                    {c.nombre}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {c.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {c.telefono}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={11} /> {c.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(c.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
