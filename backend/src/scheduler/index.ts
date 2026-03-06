import cron from "node-cron";
import { prisma } from "../common/db.js";
import { emailService } from "../integrations/email/index.js";
import type { BookingEmailData } from "../integrations/email/index.js";

// ===== CRON: Procesar recordatorios cada minuto =====
export function startScheduler(): void {
  console.log("[scheduler] Iniciando cron de recordatorios (cada minuto)");

  cron.schedule("* * * * *", async () => {
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
        take: 20, // procesar máximo 20 por ciclo para no saturar
      });

      if (pendientes.length === 0) return;

      console.log(`[scheduler] Procesando ${pendientes.length} recordatorios pendientes`);

      for (const reminder of pendientes) {
        // Saltar si la reserva fue cancelada
        if (reminder.booking.estado === "CANCELADA") {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { enviado: true, enviadoAt: ahora },
          });
          continue;
        }

        let exito = false;

        if (reminder.canal === "EMAIL" && reminder.booking.customer.email) {
          const tipoEmail = reminder.tipo === "RECORDATORIO_24H" ? "24h" as const : "1h" as const;
          const emailData: BookingEmailData = {
            clienteNombre: reminder.booking.customer.nombre,
            clienteEmail: reminder.booking.customer.email,
            servicioNombre: reminder.booking.service.nombre,
            fecha: reminder.booking.fecha,
            fechaFin: reminder.booking.fechaFin,
            bookingId: reminder.booking.id,
          };
          exito = await emailService.sendReminder(emailData, tipoEmail);
        } else if (reminder.canal === "WHATSAPP") {
          // TODO: implementar envío real de WhatsApp
          console.log(`[scheduler] WhatsApp no implementado → ${reminder.booking.customer.telefono}`);
        }

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { enviado: true, enviadoAt: new Date() },
        });

        console.log(`[scheduler] ${reminder.tipo} → ${reminder.booking.customer.nombre} (${exito ? "enviado" : "sin canal"})`);
      }
    } catch (error) {
      console.error("[scheduler] Error procesando recordatorios:", error);
    }
  });
}
