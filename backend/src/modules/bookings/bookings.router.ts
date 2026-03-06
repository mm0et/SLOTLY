import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/db.js";
import { requireAuth } from "../../common/auth.middleware.js";
import { handleValidationError, handleServerError } from "../../common/errors.js";
import { emailService } from "../../integrations/email/index.js";
import type { BookingEmailData } from "../../integrations/email/index.js";
import { googleCalendar } from "../../integrations/google-calendar/index.js";

export const bookingsRouter = Router();

// ===== SCHEMAS =====
const createBookingSchema = z.object({
  fecha: z.string().datetime({ message: "Fecha ISO requerida" }),
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  userId: z.string().nullable().optional(), // barbero asignado
  notas: z.string().nullable().optional(),
});

const updateStatusSchema = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA", "NO_SHOW"]),
});

// ===== GET /api/bookings — listar (autenticado) =====
bookingsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { desde, hasta, estado } = req.query;

    const where: Record<string, unknown> = {};
    if (desde) where.fecha = { ...((where.fecha as object) || {}), gte: new Date(desde as string) };
    if (hasta) where.fecha = { ...((where.fecha as object) || {}), lte: new Date(hasta as string) };
    if (estado) where.estado = estado;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, nombre: true, apellidos: true, telefono: true, email: true } },
        service: { select: { id: true, nombre: true, duracion: true, color: true } },
        user: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: "asc" },
    });

    res.json(bookings);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== GET /api/bookings/:id =====
bookingsRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        service: true,
        user: { select: { id: true, nombre: true } },
        reminders: true,
      },
    });

    if (!booking) {
      res.status(404).json({ error: "Reserva no encontrada" });
      return;
    }

    res.json(booking);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== POST /api/bookings — crear reserva =====
bookingsRouter.post("/", async (req, res) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Obtener duración del servicio para calcular fechaFin
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }

    const fechaInicio = new Date(data.fecha);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + service.duracion);

    // Verificar que no haya conflicto
    const conflicto = await prisma.booking.findFirst({
      where: {
        fecha: { lt: fechaFin },
        fechaFin: { gt: fechaInicio },
        estado: { notIn: ["CANCELADA"] },
        ...(data.userId ? { userId: data.userId } : {}),
      },
    });

    if (conflicto) {
      res.status(409).json({ error: "El horario ya está ocupado" });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        fecha: fechaInicio,
        fechaFin,
        customerId: data.customerId,
        serviceId: data.serviceId,
        userId: data.userId ?? null,
        notas: data.notas ?? null,
      },
      include: {
        customer: { select: { nombre: true, apellidos: true, telefono: true, email: true } },
        service: { select: { nombre: true, duracion: true } },
      },
    });

    // Enviar email de confirmación (async, no bloquea la respuesta)
    if (booking.customer.email) {
      const emailData: BookingEmailData = {
        clienteNombre: [booking.customer.nombre, booking.customer.apellidos].filter(Boolean).join(" "),
        clienteEmail: booking.customer.email,
        servicioNombre: booking.service.nombre,
        fecha: fechaInicio,
        fechaFin,
        bookingId: booking.id,
        notas: data.notas ?? null,
      };
      emailService.sendConfirmation(emailData).catch((err) =>
        console.error("[booking] Error enviando email confirmación:", err)
      );
    }

    // Crear recordatorios automáticos (24h y 1h antes)
    const recordatorios = [];
    const ahora = new Date();

    const enviar24h = new Date(fechaInicio);
    enviar24h.setHours(enviar24h.getHours() - 24);
    if (enviar24h > ahora) {
      recordatorios.push({
        bookingId: booking.id,
        tipo: "RECORDATORIO_24H" as const,
        canal: booking.customer.email ? "EMAIL" as const : "WHATSAPP" as const,
        enviarEn: enviar24h,
      });
    }

    const enviar1h = new Date(fechaInicio);
    enviar1h.setHours(enviar1h.getHours() - 1);
    if (enviar1h > ahora) {
      recordatorios.push({
        bookingId: booking.id,
        tipo: "RECORDATORIO_1H" as const,
        canal: booking.customer.email ? "EMAIL" as const : "WHATSAPP" as const,
        enviarEn: enviar1h,
      });
    }

    if (recordatorios.length > 0) {
      await prisma.reminder.createMany({ data: recordatorios });
      console.log(`[booking] ${recordatorios.length} recordatorios creados para reserva ${booking.id}`);
    }

    // Crear evento en Google Calendar (async, no bloquea)
    if (googleCalendar.isConfigured()) {
      const adminConnection = await prisma.calendarConnection.findFirst({
        where: { activo: true },
        select: { userId: true },
      });
      if (adminConnection) {
        googleCalendar.createEvent(adminConnection.userId, {
          titulo: `${service.nombre} — ${booking.customer.nombre} ${booking.customer.apellidos || ""}`.trim(),
          descripcion: `Reserva #${booking.id}`,
          inicio: fechaInicio,
          fin: fechaFin,
          clienteNombre: [booking.customer.nombre, booking.customer.apellidos].filter(Boolean).join(" "),
          clienteEmail: booking.customer.email || undefined,
          clienteTelefono: booking.customer.telefono || undefined,
        }).then(async (eventId) => {
          if (eventId) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { googleEventId: eventId },
            });
            console.log(`[booking] Evento GCal vinculado: ${eventId}`);
          }
        }).catch((err) => console.error("[booking] Error creando evento GCal:", err));
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== PATCH /api/bookings/:id/status — cambiar estado =====
bookingsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { estado } = updateStatusSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { estado },
    });
    res.json(booking);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== DELETE /api/bookings/:id — cancelar =====
bookingsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { estado: "CANCELADA" },
      include: {
        customer: { select: { nombre: true, apellidos: true, email: true } },
        service: { select: { nombre: true } },
      },
    });

    // Enviar email de cancelación
    if (booking.customer.email) {
      emailService.sendCancellation({
        clienteNombre: [booking.customer.nombre, booking.customer.apellidos].filter(Boolean).join(" "),
        clienteEmail: booking.customer.email,
        servicioNombre: booking.service.nombre,
        fecha: booking.fecha,
        fechaFin: booking.fechaFin,
        bookingId: booking.id,
      }).catch((err) => console.error("[booking] Error enviando email cancelación:", err));
    }

    // Cancelar recordatorios pendientes
    await prisma.reminder.updateMany({
      where: { bookingId: booking.id, enviado: false },
      data: { enviado: true, enviadoAt: new Date() },
    });

    // Cancelar evento en Google Calendar
    if (googleCalendar.isConfigured()) {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        select: { googleEventId: true },
      });
      if (fullBooking?.googleEventId) {
        const adminConnection = await prisma.calendarConnection.findFirst({
          where: { activo: true },
          select: { userId: true },
        });
        if (adminConnection) {
          googleCalendar.deleteEvent(adminConnection.userId, fullBooking.googleEventId)
            .catch((err) => console.error("[booking] Error eliminando evento GCal:", err));
        }
      }
    }

    res.json({ ok: true, mensaje: "Reserva cancelada" });
  } catch (error) {
    handleServerError(error, res);
  }
});
