"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, User, Phone, Mail, Loader2 } from "lucide-react";

export interface CustomerData {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  notas: string;
  whatsapp: boolean;
}

interface Props {
  onSubmit: (data: CustomerData) => void;
  loading?: boolean;
}

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, icon, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.15em] text-neutral-400">
        <span className="text-gold-400/70">{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
}

const inputCls = (hasError?: string) => cn(
  "w-full px-5 py-5 text-base rounded-2xl transition-all duration-300",
  "bg-white/[0.04] border text-white placeholder:text-neutral-600",
  "outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400/40 focus:bg-white/[0.06]",
  hasError
    ? "border-red-500/40 ring-1 ring-red-500/20"
    : "border-white/[0.08] hover:border-white/[0.14]"
);

export function CustomerForm({ onSubmit, loading }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!telefono.trim() && !email.trim()) {
      errs.contacto = "Indica al menos teléfono o email";
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
    onSubmit({ nombre: nombre.trim(), apellidos: "", telefono: telefono.trim(), email: email.trim(), notas: "", whatsapp });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">

      {/* ── Título del form ── */}
      <div className="text-center mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-400/50 mb-1">Paso final</p>
        <h3 className="text-xl sm:text-2xl font-bold font-display text-white">Tus datos</h3>
        <p className="text-sm text-neutral-500 mt-1">Rellena tu información para confirmar la cita</p>
      </div>

      {/* ── Campo Nombre ── */}
      <Field label="Nombre" icon={<User size={13} strokeWidth={2.5} />} error={errors.nombre}>
        <input
          className={inputCls(errors.nombre)}
          placeholder="¿Cómo te llamas?"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="name"
        />
      </Field>

      {/* ── Teléfono + Email en 2 cols ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Teléfono" icon={<Phone size={13} strokeWidth={2.5} />} error={errors.contacto}>
          <input
            type="tel"
            className={inputCls(errors.contacto)}
            placeholder="612 345 678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
          />
        </Field>
        <Field label="Email" icon={<Mail size={13} strokeWidth={2.5} />} error={errors.email || errors.contacto}>
          <input
            type="email"
            className={inputCls(errors.email || errors.contacto)}
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
      </div>

      {/* ── Toggle WhatsApp ── */}
      <div className="flex justify-center">
      <button
        type="button"
        onClick={() => setWhatsapp(!whatsapp)}
        className={cn(
          "w-1/2 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer text-left",
          whatsapp
            ? "bg-green-500/[0.05] border-green-500/15 hover:bg-green-500/08"
            : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.10]"
        )}
      >
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
          whatsapp ? "bg-green-500/15" : "bg-white/[0.04]"
        )}>
          <MessageCircle size={14} strokeWidth={1.5} className={cn("transition-colors duration-300", whatsapp ? "text-green-400" : "text-neutral-600")} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-semibold transition-colors duration-300", whatsapp ? "text-neutral-300" : "text-neutral-600")}>
            Recordatorio por WhatsApp
          </p>
        </div>

        <div className={cn(
          "w-9 h-5 rounded-full transition-all duration-300 shrink-0 relative",
          whatsapp ? "bg-green-500" : "bg-neutral-700"
        )}>
          <div className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300",
            whatsapp ? "left-[18px]" : "left-0.5"
          )} />
        </div>
      </button>
      </div>

      {/* ── Botón submit ── */}
      <div className="flex justify-center mt-4">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "relative w-96 py-6 rounded-2xl font-bold uppercase tracking-[0.25em] transition-all duration-300",
            "bg-gold-400 text-neutral-950 text-lg",
            "shadow-2xl shadow-gold-400/30",
            "hover:bg-gold-300 hover:shadow-gold-400/40 hover:-translate-y-1 hover:scale-[1.03]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100",
            "flex items-center justify-center gap-3 cursor-pointer overflow-hidden group"
          )}
        >
          {/* Brillo hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Confirmando…
            </>
          ) : (
            <>
              Confirmar reserva
              <span className="text-lg">→</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
}
