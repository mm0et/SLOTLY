"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export interface CustomerData {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  notas: string;
}

interface Props {
  onSubmit: (data: CustomerData) => void;
  loading?: boolean;
}

export function CustomerForm({ onSubmit, loading }: Props) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!telefono.trim() && !email.trim()) {
      errs.telefono = "Indica al menos teléfono o email";
      errs.email = "Indica al menos teléfono o email";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Email no válido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      notas: notas.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
          Tus datos
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Para confirmar tu reserva
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errors.nombre}
          />
          <Input
            label="Apellidos"
            placeholder="Tus apellidos"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            type="tel"
            placeholder="612 345 678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            error={errors.telefono}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        </div>

        <Input
          label="Notas (opcional)"
          placeholder="Algo que debamos saber..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />

        <Button type="submit" size="lg" loading={loading} className="w-full mt-4">
          Confirmar reserva
        </Button>
      </form>
    </div>
  );
}
