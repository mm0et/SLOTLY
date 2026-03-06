import { Router } from "express";
import { requireAuth } from "../../common/auth.middleware.js";
import { googleCalendar } from "../../integrations/google-calendar/index.js";
import { handleServerError } from "../../common/errors.js";
import { prisma } from "../../common/db.js";

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

    const userId = (req as any).userId;
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

    const userId = (req as any).userId;
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
    const userId = (req as any).userId;
    await googleCalendar.disconnect(userId);
    res.json({ ok: true, mensaje: "Google Calendar desconectado" });
  } catch (error) {
    handleServerError(error, res);
  }
});
