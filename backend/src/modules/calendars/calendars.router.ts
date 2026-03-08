import { Router } from "express";
import { requireAuth } from "../../common/auth.middleware.js";
import { googleCalendar } from "../../integrations/google-calendar/index.js";
import { handleServerError } from "../../common/errors.js";
import { prisma } from "../../common/db.js";
import { emailService } from "../../integrations/email/index.js";
import type { BookingEmailData } from "../../integrations/email/index.js";

export const calendarsRouter = Router();

// ===== GET /api/calendars/status =====
// Devuelve el estado de la conexión con Google Calendar
calendarsRouter.get("/status", requireAuth, async (req, res) => {
  try {
    if (!googleCalendar.isConfigured()) {
      res.json({
        configurado: false,
        conectado: false,
        mensaje: "Credenciales de Google Calendar no configuradas en el servidor",
      });
      return;
    }

    const userId = (req as any).user?.userId;
    const connection = await prisma.calendarConnection.findFirst({
      where: { userId, activo: true },
    });

    res.json({
      configurado: true,
      conectado: !!connection,
      calendarId: connection?.calendarId || null,
      mensaje: connection
        ? "Google Calendar conectado"
        : "Google Calendar disponible pero no conectado",
    });
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== GET /api/calendars/connect =====
// Devuelve la URL de autorización OAuth para redirigir al usuario
calendarsRouter.get("/connect", requireAuth, async (req, res) => {
  try {
    if (!googleCalendar.isConfigured()) {
      res.status(400).json({
        error: "Credenciales de Google Calendar no configuradas",
      });
      return;
    }

    const userId = (req as any).user?.userId;
    const authUrl = googleCalendar.getAuthUrl(userId);

    res.json({ authUrl });
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== GET /api/calendars/callback?code=xxx&state=userId =====
// Google redirige aquí tras autorizar
calendarsRouter.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Código de autorización no proporcionado" });
      return;
    }

    // El state contiene el userId
    const userId = state as string;
    if (!userId) {
      res.status(400).json({ error: "Estado de usuario no proporcionado" });
      return;
    }

    await googleCalendar.handleCallback(code, userId);

    // Inicializar syncToken y registrar webhook (async, no bloquea la respuesta)
    googleCalendar.initSyncToken(userId)
      .then(() => googleCalendar.registerWatch(userId))
      .catch((err) => console.error("[calendars] Error configurando webhook:", err));

    // Redirigir al admin con mensaje de éxito
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><title>Google Calendar conectado</title></head>
      <body style="font-family: system-ui; text-align: center; padding: 60px 20px;">
        <h1 style="color: #22c55e;">✓ Google Calendar conectado</h1>
        <p>Ya puedes cerrar esta ventana y volver al panel de administración.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("[calendars] Error en callback OAuth:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><title>Error</title></head>
      <body style="font-family: system-ui; text-align: center; padding: 60px 20px;">
        <h1 style="color: #ef4444;">✗ Error al conectar</h1>
        <p>No se pudo conectar con Google Calendar. Inténtalo de nuevo.</p>
      </body>
      </html>
    `);
  }
});

// ===== POST /api/calendars/disconnect =====
calendarsRouter.post("/disconnect", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    await googleCalendar.stopWatch(userId);
    await googleCalendar.disconnect(userId);
    res.json({ ok: true, mensaje: "Google Calendar desconectado" });
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== POST /api/calendars/webhook =====
// Google llama aquí en el momento en que cambia cualquier evento del calendario
calendarsRouter.post("/webhook", async (req, res) => {
  // Responder 200 INMEDIATAMENTE — Google requiere respuesta rápida
  res.status(200).send("ok");

  // Procesar en background
  const channelId = req.headers["x-goog-channel-id"] as string;
  const resourceState = req.headers["x-goog-resource-state"] as string;

  // "sync" es el primer ping al registrar el watch, ignorarlo
  if (resourceState === "sync") {
    console.log("[webhook] Ping de sincronización inicial recibido");
    return;
  }

  console.log(`[webhook] Notificación recibida — channelId: ${channelId}, state: ${resourceState}`);

  try {
    // Buscar a qué usuario corresponde este channelId
    const connection = await prisma.calendarConnection.findFirst({
      where: { channelId, activo: true },
      select: { userId: true },
    });

    if (!connection) {
      console.log(`[webhook] No se encontró conexión para channelId: ${channelId}`);
      return;
    }

    // Obtener eventos cancelados desde la última sync
    const cancelados = await googleCalendar.getChangedEvents(connection.userId);
    if (cancelados.length === 0) return;

    for (const { googleEventId } of cancelados) {
      const booking = await prisma.booking.findFirst({
        where: {
          googleEventId,
          estado: { notIn: ["CANCELADA", "COMPLETADA", "NO_SHOW"] },
        },
        include: {
          customer: true,
          service: true,
        },
      });

      if (!booking) continue;

      // Cancelar reserva en BD
      await prisma.booking.update({
        where: { id: booking.id },
        data: { estado: "CANCELADA" },
      });

      console.log(`[webhook] Reserva ${booking.id} cancelada — evento ${googleEventId} eliminado en GCal`);

      // Enviar email de cancelación al instante
      if (booking.customer.email) {
        const emailData: BookingEmailData = {
          clienteNombre: [booking.customer.nombre, booking.customer.apellidos].filter(Boolean).join(" "),
          clienteEmail: booking.customer.email,
          servicioNombre: booking.service.nombre,
          fecha: booking.fecha,
          fechaFin: booking.fechaFin,
          bookingId: booking.id,
        };
        await emailService.sendCancellation(emailData);
        console.log(`[webhook] Email de cancelación enviado a ${booking.customer.email}`);
      }
    }
  } catch (error) {
    console.error("[webhook] Error procesando notificación:", error);
  }
});
