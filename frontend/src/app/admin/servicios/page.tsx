"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { Service } from "@/lib/types";
import { Card, Button, Input } from "@/components/ui";
import { Plus, Pencil, Trash2, X, Clock, Euro } from "lucide-react";

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Partial<Service> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getServices();
      setServices(data);
    } catch {
      setError("Error cargando servicios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setEditando({
      nombre: "",
      duracion: 30,
      precio: 0,
      buffer: 0,
      color: "#e94560",
      descripcion: "",
    });
  };

  const abrirEditar = (service: Service) => {
    setEditando({ ...service });
  };

  const guardar = async () => {
    if (!editando || !editando.nombre) return;
    setSaving(true);
    setError(null);

    try {
      if (editando.id) {
        await api.updateService(editando.id, editando);
      } else {
        await api.createService(editando);
      }
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Desactivar este servicio?")) return;
    try {
      await api.deleteService(id);
      await cargar();
    } catch {
      setError("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
            Servicios
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Tipos de cita que ofreces
          </p>
        </div>
        <Button size="sm" onClick={abrirNuevo}>
          <Plus size={14} /> Nuevo servicio
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-xl text-sm border"
          style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "var(--color-error)" }}
        >
          {error}
        </div>
      )}

      {/* Modal de edición inline */}
      {editando && (
        <Card className="space-y-4 border-2" >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>
              {editando.id ? "Editar servicio" : "Nuevo servicio"}
            </h3>
            <button onClick={() => setEditando(null)}>
              <X size={18} style={{ color: "var(--color-text-secondary)" }} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Corte de pelo"
              value={editando.nombre || ""}
              onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
            />
            <Input
              label="Descripción"
              placeholder="Opcional"
              value={editando.descripcion || ""}
              onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
            />
            <Input
              label="Duración (min)"
              type="number"
              min={5}
              step={5}
              value={editando.duracion || 30}
              onChange={(e) => setEditando({ ...editando, duracion: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Precio (€)"
              type="number"
              min={0}
              step={0.5}
              value={editando.precio || 0}
              onChange={(e) => setEditando({ ...editando, precio: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Buffer entre citas (min)"
              type="number"
              min={0}
              step={5}
              value={editando.buffer || 0}
              onChange={(e) => setEditando({ ...editando, buffer: parseInt(e.target.value) || 0 })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editando.color || "#e94560"}
                  onChange={(e) => setEditando({ ...editando, color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <span className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
                  {editando.color}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button size="sm" loading={saving} onClick={guardar}>
              {editando.id ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </div>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-border)", borderTopColor: "transparent" }}
          />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-medium" style={{ color: "var(--color-text)" }}>
            No hay servicios
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Crea tu primer servicio para empezar a recibir reservas
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-12 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                    {s.nombre}
                  </h3>
                  {s.descripcion && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {s.descripcion}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="flex items-center gap-1"><Clock size={12} /> {s.duracion} min</span>
                  <span className="flex items-center gap-1 font-bold" style={{ color: "var(--color-accent)" }}>
                    <Euro size={12} /> {s.precio.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirEditar(s)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                  <button
                    onClick={() => eliminar(s.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Desactivar"
                  >
                    <Trash2 size={14} style={{ color: "var(--color-error)" }} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
