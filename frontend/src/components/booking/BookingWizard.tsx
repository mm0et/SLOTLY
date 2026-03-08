"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import type { Service, TimeSlot } from "@/lib/types";

import { ServiceSelector } from "./ServiceSelector";
import { DatePicker } from "./DatePicker";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { CustomerForm, type CustomerData } from "./CustomerForm";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// step 0 = servicios | step 1 = calendario+horas | step 2 = formulario
const STEP_TITLES: Record<number, string> = {
  0: "Elige tu servicio",
  1: "Elige el día y la hora",
  2: "Confirma tu cita",
};

export function BookingWizard() {
  const router = useRouter();
  const apiClient = useApi();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  /* ── Carga inicial ── */
  useEffect(() => {
    apiClient.getServices()
      .then(setServices)
      .catch(() => setError("No se pudieron cargar los servicios"))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    apiClient.getAvailabilityRules()
      .then((rules) => {
        const dias = rules.filter((r) => r.activo).map((r) => r.diaSemana);
        setAvailableDays(dias);
      })
      .catch(() => setAvailableDays([1, 2, 3, 4, 5, 6]));
  }, []);

  /* ── Cargar slots al elegir día ── */
  const loadSlots = useCallback(async (fecha: string, serviceId: string) => {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await apiClient.getSlots(fecha, serviceId);
      setSlots(res.slots);
    } catch {
      setError("No se pudieron cargar los horarios");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  /* ── Handlers ── */
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setError(null);
    setStep(1);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setError(null);
    if (selectedService) loadSlots(date, selectedService.id);
  };

  const handleSlotSelect = (hora: string) => {
    setSelectedSlot(hora);
    setError(null);
    setStep(2);
  };

  const handleCustomerSubmit = async (data: CustomerData) => {
    if (!selectedService || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const customer = await apiClient.createCustomer({
        nombre: data.nombre,
        apellidos: data.apellidos || null,
        telefono: data.telefono || null,
        email: data.email || null,
        notas: data.notas || null,
      });
      const fechaHora = `${selectedDate}T${selectedSlot}:00.000Z`;
      const booking = await apiClient.createBooking({
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
    if (step === 2) {
      setSelectedSlot(null);
      setStep(1);
    } else if (step === 1) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlots([]);
      setStep(0);
    }
  };

  /* ── Subtítulo de cabecera ── */
  const headerSubtitle = () => {
    if (step === 1 && selectedService) return selectedService.nombre;
    if (step === 2 && selectedService && selectedDate && selectedSlot) {
      const d = new Date(selectedDate + "T12:00:00");
      const fecha = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
      return `${selectedService.nombre} · ${fecha} · ${selectedSlot}`;
    }
    return null;
  };

  /* ── Resumen compacto para el paso 2 ── */
  const ResumenCompacto = () => {
    if (!selectedService || !selectedDate || !selectedSlot) return null;
    const d = new Date(selectedDate + "T12:00:00");
    const diaNombre = d.toLocaleDateString("es-ES", { weekday: "long" });
    const diaNum = d.toLocaleDateString("es-ES", { day: "numeric" });
    const mesNombre = d.toLocaleDateString("es-ES", { month: "long" });
    return (
      <div className="w-full max-w-2xl mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          {/* Servicio */}
          <div className="flex flex-col items-center justify-center gap-1 py-5 px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">Servicio</p>
            <p className="text-sm font-bold text-white text-center">{selectedService.nombre}</p>
            <p className="text-gold-400 font-bold text-base">{selectedService.precio.toFixed(2).replace(".00","")} €</p>
          </div>
          {/* Fecha */}
          <div className="flex flex-col items-center justify-center gap-1 py-5 px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">Fecha</p>
            <p className="text-sm font-bold text-white capitalize">{diaNombre}</p>
            <p className="text-neutral-400 text-sm">{diaNum} de {mesNombre}</p>
          </div>
          {/* Hora */}
          <div className="flex flex-col items-center justify-center gap-1 py-5 px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">Hora</p>
            <p className="text-3xl font-bold font-display text-gold-400 leading-none">{selectedSlot}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── Fondo fijo full-bleed ── */}
      <div className="fixed inset-0 -z-10">
        <img src="/barber1.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* ── Banner DEMO ── */}
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-gold-400 text-neutral-950 text-[11px] font-bold uppercase tracking-[0.3em] py-1.5">
          <span>⚡</span> Modo demo — ninguna acción es real <span>⚡</span>
        </div>
      )}

      {/* ── Wrapper principal ── */}
      <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-10 sm:gap-12">

          {/* Título principal */}
          <div className="text-center">
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.5em] uppercase text-gold-400/70 mb-3">
              Barbería de autor
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-white italic leading-none">
              MUERTE <span className="text-gold-400">O GLORIA</span>
            </h1>
            <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
          </div>

          {/* ── TARJETA ── */}
          <div className="w-full max-w-6xl min-h-[600px] rounded-3xl bg-black/55 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 flex flex-col">

            {/* Cabecera */}
            <div className={cn(
              "flex items-center px-10 sm:px-16 pt-10 pb-7 border-b border-white/[0.06]",
              step === 0 ? "justify-center" : "justify-between"
            )}>
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-neutral-400 hover:text-gold-400 hover:border-gold-400/30 transition-all duration-300 cursor-pointer shrink-0"
                >
                  <ArrowLeft size={17} />
                </button>
              )}

              <div className="text-center flex-1">
                {step === 0 && (
                  <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-gold-400/60 mb-1">
                    Nuestros servicios · <span className="text-white/30">v17</span>
                  </p>
                )}
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  {STEP_TITLES[step]}
                </h2>
                {headerSubtitle() && (
                  <p className="text-[12px] text-gold-400/70 font-medium tracking-wide mt-1 capitalize">
                    {headerSubtitle()}
                  </p>
                )}
              </div>

              {/* Dots progreso */}
              {step > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        s < step  && "bg-gold-400 w-1.5",
                        s === step && "bg-gold-400 w-6",
                        s > step  && "bg-neutral-700 w-1.5"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cuerpo */}
            <div className="px-10 sm:px-16 py-12 sm:py-14 flex-1 flex flex-col items-center justify-center">

              {/* Error */}
              {error && (
                <div className="w-full max-w-lg mb-8 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
                  <span>{error}</span>
                  <button className="ml-3 underline font-semibold hover:text-red-300 shrink-0" onClick={() => setError(null)}>
                    Cerrar
                  </button>
                </div>
              )}

              <div key={step} className="animate-fade-in w-full flex flex-col items-center">

                {/* ── PASO 0: Servicios ── */}
                {step === 0 && (
                  loadingServices ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs uppercase tracking-wider text-neutral-500">Cargando servicios...</p>
                    </div>
                  ) : (
                    <ServiceSelector
                      services={services}
                      selectedId={selectedService?.id || null}
                      onSelect={handleServiceSelect}
                    />
                  )
                )}

                {/* ── PASO 1: Calendario + Slots ── */}
                {step === 1 && (
                  <div className="w-full">
                    {/* Contenedor split: sin fecha=centrado | con fecha=50/50 */}
                    <div className={cn(
                      "flex transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      selectedDate
                        ? "flex-row items-start gap-8"
                        : "flex-col items-center"
                    )}>

                      {/* Calendario */}
                      <div className={cn(
                        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        selectedDate ? "w-1/2" : "w-full max-w-2xl mx-auto"
                      )}>
                        <DatePicker
                          selectedDate={selectedDate}
                          onSelect={handleDateSelect}
                          availableDays={availableDays}
                          compact={!!selectedDate}
                        />
                      </div>

                      {/* Divisor vertical */}
                      {selectedDate && (
                        <div className="w-px self-stretch bg-white/[0.06] shrink-0 animate-fade-in" />
                      )}

                      {/* Slots — aparecen a la derecha */}
                      {selectedDate && (
                        <div className="w-1/2 animate-fade-in">
                          <TimeSlotGrid
                            slots={slots}
                            selectedSlot={selectedSlot}
                            onSelect={handleSlotSelect}
                            loading={slotsLoading}
                            fecha={selectedDate}
                          />
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* ── PASO 2: Formulario ── */}
                {step === 2 && (
                  <div className="w-full flex flex-col items-center">
                    <ResumenCompacto />
                    <div className="w-full max-w-2xl">
                      <CustomerForm onSubmit={handleCustomerSubmit} loading={submitting} />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <p className="mt-auto pt-6 text-[10px] uppercase tracking-[0.3em] text-neutral-600">
          © {new Date().getFullYear()} Muerte o Gloria Barbershop
        </p>
      </div>
    </>
  );
}
