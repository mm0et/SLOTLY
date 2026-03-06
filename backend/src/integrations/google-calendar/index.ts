// Integración con Google Calendar API
// Docs: https://developers.google.com/calendar/api/v3/reference

import { google, calendar_v3 } from "googleapis";
import { config } from "../../config/index.js";
import { prisma } from "../../common/db.js";

// ===== SCOPES requeridos =====
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// ===== Helper: crear cliente OAuth2 =====
function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

// ===== Helper: cliente autenticado desde BD =====
async function getAuthenticatedClient(userId: string) {
  const connection = await prisma.calendarConnection.findFirst({
    where: { userId, activo: true },
  });

  if (!connection) return null;

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
  });

  // Escuchar tokens renovados y actualizar en BD
  oauth2Client.on("tokens", async (tokens) => {
    console.log("[gcal] Token renovado automáticamente");
    const updateData: Record<string, string> = {};
    if (tokens.access_token) updateData.accessToken = tokens.access_token;
    if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token;
    if (Object.keys(updateData).length > 0) {
      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: updateData,
      });
    }
  });

  return { client: oauth2Client, calendarId: connection.calendarId };
}

export const googleCalendar = {
  // ===== ¿Está configurado? =====
  isConfigured(): boolean {
    return !!(
      config.google.clientId &&
      config.google.clientSecret &&
      config.google.redirectUri
    );
  },

  // ===== Generar URL de autorización OAuth =====
  getAuthUrl(state?: string): string {
    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      state: state || "",
    });
  },

  // ===== Intercambiar code por tokens =====
  async handleCallback(code: string, userId: string) {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("No se obtuvieron tokens válidos de Google");
    }

    // Guardar o actualizar la conexión en BD
    const existing = await prisma.calendarConnection.findFirst({
      where: { userId },
    });

    if (existing) {
      await prisma.calendarConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          activo: true,
        },
      });
    } else {
      await prisma.calendarConnection.create({
        data: {
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          calendarId: "primary",
        },
      });
    }

    console.log(`[gcal] Conexión OAuth guardada para usuario ${userId}`);
    return { ok: true };
  },

  // ===== Crear evento en Google Calendar =====
  async createEvent(userId: string, eventData: {
    titulo: string;
    descripcion?: string;
    inicio: Date;
    fin: Date;
    clienteNombre?: string;
    clienteEmail?: string;
    clienteTelefono?: string;
  }): Promise<string | null> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) {
      console.log("[gcal] No hay conexión activa, no se crea evento");
      return null;
    }

    const calendar = google.calendar({ version: "v3", auth: auth.client });

    const event: calendar_v3.Schema$Event = {
      summary: eventData.titulo,
      description: [
        eventData.descripcion || "",
        eventData.clienteNombre ? `Cliente: ${eventData.clienteNombre}` : "",
        eventData.clienteTelefono ? `Tel: ${eventData.clienteTelefono}` : "",
        eventData.clienteEmail ? `Email: ${eventData.clienteEmail}` : "",
      ].filter(Boolean).join("\n"),
      start: {
        dateTime: eventData.inicio.toISOString(),
        timeZone: "Europe/Madrid",
      },
      end: {
        dateTime: eventData.fin.toISOString(),
        timeZone: "Europe/Madrid",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
        ],
      },
    };

    try {
      const res = await calendar.events.insert({
        calendarId: auth.calendarId,
        requestBody: event,
      });
      console.log(`[gcal] Evento creado: ${res.data.id}`);
      return res.data.id || null;
    } catch (error) {
      console.error("[gcal] Error creando evento:", error);
      return null;
    }
  },

  // ===== Eliminar evento =====
  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return false;

    const calendar = google.calendar({ version: "v3", auth: auth.client });

    try {
      await calendar.events.delete({
        calendarId: auth.calendarId,
        eventId,
      });
      console.log(`[gcal] Evento eliminado: ${eventId}`);
      return true;
    } catch (error) {
      console.error("[gcal] Error eliminando evento:", error);
      return false;
    }
  },

  // ===== Listar eventos de un día (para detectar huecos ocupados) =====
  async listEvents(userId: string, fecha: string): Promise<{ inicio: Date; fin: Date }[]> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return [];

    const calendar = google.calendar({ version: "v3", auth: auth.client });

    const timeMin = new Date(fecha);
    timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date(fecha);
    timeMax.setHours(23, 59, 59, 999);

    try {
      const res = await calendar.events.list({
        calendarId: auth.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = res.data.items || [];
      return events
        .filter((e) => e.start?.dateTime && e.end?.dateTime)
        .map((e) => ({
          inicio: new Date(e.start!.dateTime!),
          fin: new Date(e.end!.dateTime!),
        }));
    } catch (error) {
      console.error("[gcal] Error listando eventos:", error);
      return [];
    }
  },

  // ===== Verificar conflictos con Google Calendar =====
  async checkConflicts(
    userId: string,
    fecha: string,
    slotInicio: Date,
    slotFin: Date
  ): Promise<boolean> {
    const events = await this.listEvents(userId, fecha);
    return events.some((e) => slotInicio < e.fin && slotFin > e.inicio);
  },

  // ===== Desconectar =====
  async disconnect(userId: string): Promise<boolean> {
    try {
      await prisma.calendarConnection.updateMany({
        where: { userId },
        data: { activo: false },
      });
      console.log(`[gcal] Desconectado para usuario ${userId}`);
      return true;
    } catch (error) {
      console.error("[gcal] Error desconectando:", error);
      return false;
    }
  },
};
