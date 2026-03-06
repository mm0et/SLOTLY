"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Service, TimeSlot } from "@/lib/types";

import { StepIndicator } from "./StepIndicator";
import { ServiceSelector } from "./ServiceSelector";
import { DatePicker } from "./DatePicker";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { CustomerForm, type CustomerData } from "./CustomerForm";
import { BookingSummary } from "./BookingSummary";
import { ArrowLeft } from "lucide-react";

const STEPS = ["Servicio", "Fecha", "Hora", "Datos"];

export function BookingWizard() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    api
      .getServices()
      .then(setServices)
      .catch(() => setError("No se pudieron cargar los servicios"))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    api
      .getAvailabilityRules()
      .then((rules) => {
        const dias = rules.filter((r) => r.activo).map((r) => r.diaSemana);
        setAvailableDays(dias);
      })
      .catch(() => setAvailableDays([1, 2, 3, 4, 5, 6]));
  }, []);

  const loadSlots = useCallback(async (fecha: string, serviceId: string) => {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await api.getSlots(fecha, serviceId);
      setSlots(res.slots);
    } catch {
      setError("No se pudieron cargar los horarios");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep(1);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(2);
    if (selectedService) loadSlots(date, selectedService.id);
  };

  const handleSlotSelect = (hora: string) => {
    setSelectedSlot(hora);
    setStep(3);
  };

  const handleCustomerSubmit = async (data: CustomerData) => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setCustomerData(data);
    setSubmitting(true);
    setError(null);

    try {
      const customer = await api.createCustomer({
        nombre: data.nombre,
        apellidos: data.apellidos || null,
        telefono: data.telefono || null,
        email: data.email || null,
        notas: data.notas || null,
      });

      const fechaHora = `${selectedDate}T${selectedSlot}:00.000Z`;
      const booking = await api.createBooking({
        fecha: fechaHora,
        customerId: customer.id,
        serviceId: selectedService.id,
      });

      router.push(`/confirmacion/${booking.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la reserva";
      setError(message);
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bark-950">
      {/* ── Header — premium landing banner ── */}
      <header className="relative overflow-hidden bg-bark-900">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <div className="absolute -top-8 -right-8 w-32 h-32 border border-gold-400/10 rotate-12 rounded-lg opacity-30" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 border border-gold-400/10 -rotate-6 rounded-lg opacity-20" />

        <div className="relative z-10 py-14 sm:py-20 px-6 text-center">
          <p className="text-[10px] font-semibold font-body tracking-[0.4em] uppercase text-gold-400 mb-3">
            — Barbería de autor —
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold font-display tracking-tight text-white">
            MUERTE O GLORIA
          </h1>
          <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
          <p className="text-[11px] mt-4 font-body tracking-[0.25em] uppercase text-neutral-500">
            Reserva tu cita online
          </p>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16">
        <div className={step === 0 ? "w-full max-w-5xl animate-fade-in" : "w-full max-w-3xl animate-fade-in"}>
          <StepIndicator steps={STEPS} currentStep={step} />

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400 animate-scale-in">
              {error}
              <button
                className="ml-2 underline font-semibold hover:text-red-300 transition-colors"
                onClick={() => setError(null)}
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Botón volver */}
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-8 text-neutral-500 hover:text-gold-400 transition-all duration-300 hover:gap-2.5 cursor-pointer"
            >
              <ArrowLeft size={14} /> Volver
            </button>
          )}

          {/* Loading */}
          {loadingServices ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Cargando servicios...
              </p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {step === 0 && (
                <ServiceSelector
                  services={services}
                  selectedId={selectedService?.id || null}
                  onSelect={handleServiceSelect}
                />
              )}

              {step === 1 && (
                <DatePicker
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                  availableDays={availableDays}
                />
              )}

              {step === 2 && selectedDate && (
                <TimeSlotGrid
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={handleSlotSelect}
                  loading={slotsLoading}
                  fecha={selectedDate}
                />
              )}

              {step === 3 && selectedService && selectedDate && selectedSlot && (
                <div className="space-y-8">
                  <BookingSummary
                    service={selectedService}
                    fecha={selectedDate}
                    hora={selectedSlot}
                    customer={
                      customerData || {
                        nombre: "",
                        apellidos: "",
                        telefono: "",
                        email: "",
                        notas: "",
                      }
                    }
                  />
                  <CustomerForm
                    onSubmit={handleCustomerSubmit}
                    loading={submitting}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 text-center border-t border-neutral-800/50 bg-bark-900">
        <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
          © {new Date().getFullYear()} Muerte o Gloria Barbershop
        </p>
      </footer>
    </div>
  );
}
