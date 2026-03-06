import { Router } from "express";
import { prisma } from "../../common/db.js";
import { requireAuth } from "../../common/auth.middleware.js";
import { handleServerError } from "../../common/errors.js";
import { emailService } from "../../integrations/email/index.js";
import type { BookingEmailData } from "../../integrations/email/index.js";

export const remindersRouter = Router();

// ===== GET /api/reminders/pending — recordatorios pendientes de enviar =====
remindersRouter.get("/pending", requireAuth, async (_req, res) => {
  try {
    const ahora = new Date();
    const pendientes = await prisma.reminder.findMany({
      where: {
        enviado: false,
        enviarEn: { lte: ahora },
      },
      include: {
        booking: {
          include: {
            customer: { select: { nombre: true, telefono: true, email: true } },
            service: { select: { nombre: true } },
          },
        },
      },
      orderBy: { enviarEn: "asc" },
    });
    res.json(pendientes);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== POST /api/reminders/process — procesar y enviar pendientes =====
remindersRouter.post("/process", requireAuth, async (_req, res) => {
  try {
    const ahora = new Date();
    const pendientes = await prisma.reminder.findMany({
      where: {
        enviado: false,
        enviarEn: { lte: ahora },
      },
      include: {
        booking: {
          include: {
            customer: true,
            service: true,
          },
        },
      },
    });

    let enviados = 0;
    for (const reminder of pendientes) {
      // Verificar que la reserva no esté cancelada
      if (reminder.booking.estado === "CANCELADA") {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { enviado: true, enviadoAt: new Date() },
        });
        continue;
      }

      let exito = false;

      if (reminder.canal === "EMAIL" && reminder.booking.customer.email) {
        const tipoEmail = reminder.tipo === "RECORDATORIO_24H" ? "24h" : "1h";
        const emailData: BookingEmailData = {
          clienteNombre: reminder.booking.customer.nombre,
          clienteEmail: reminder.booking.customer.email,
          servicioNombre: reminder.booking.service.nombre,
          fecha: reminder.booking.fecha,
          fechaFin: reminder.booking.fechaFin,
          bookingId: reminder.booking.id,
        };
        exito = await emailService.sendReminder(emailData, tipoEmail);
      } else if (reminder.canal === "WHATSAPP" && reminder.booking.customer.telefono) {
        // TODO: implementar envío real de WhatsApp
        console.log(`[reminder] WhatsApp no implementado → ${reminder.booking.customer.telefono}`);
        exito = false;
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { enviado: true, enviadoAt: new Date() },
      });
      enviados++;
      console.log(`[reminder] Procesado (${exito ? 'enviado' : 'sin canal'}): ${reminder.tipo} → ${reminder.booking.customer.nombre}`);
    }

    res.json({ procesados: enviados, total: pendientes.length });
  } catch (error) {
    handleServerError(error, res);
  }
});
