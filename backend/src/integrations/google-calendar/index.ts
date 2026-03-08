// Integración con Google Calendar API
// Docs: https://developers.google.com/calendar/api/v3/reference

import { google, calendar_v3 } from "googleapis";
import { randomUUID } from "crypto";
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

  // ===== Inicializar syncToken (estado base para detectar cambios) =====
  async initSyncToken(userId: string): Promise<string | null> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return null;

    const calendar = google.calendar({ version: "v3", auth: auth.client });
    try {
      const res = await calendar.events.list({
        calendarId: auth.calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 1,
        showDeleted: true,
      });
      const syncToken = res.data.nextSyncToken || null;
      if (syncToken) {
        await prisma.calendarConnection.updateMany({
          where: { userId, activo: true },
          data: { syncToken },
        });
        console.log(`[gcal] syncToken inicializado para ${userId}`);
      }
      return syncToken;
    } catch (error) {
      console.error("[gcal] Error inicializando syncToken:", error);
      return null;
    }
  },

  // ===== Registrar webhook push notification =====
  async registerWatch(userId: string): Promise<boolean> {
    if (!config.webhookBaseUrl) {
      console.log("[gcal] WEBHOOK_BASE_URL no configurado, watch no registrado");
      return false;
    }

    const auth = await getAuthenticatedClient(userId);
    if (!auth) return false;

    const calendar = google.calendar({ version: "v3", auth: auth.client });
    const channelId = randomUUID();
    const webhookUrl = `${config.webhookBaseUrl}/api/calendars/webhook`;

    try {
      const res = await calendar.events.watch({
        calendarId: auth.calendarId,
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          // Expira en 7 días (máximo de Google)
          expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const connection = await prisma.calendarConnection.findFirst({
        where: { userId, activo: true },
      });

      await prisma.calendarConnection.update({
        where: { id: connection!.id },
        data: {
          channelId,
          resourceId: res.data.resourceId || null,
          channelExpiry: new Date(Number(res.data.expiration)),
        },
      });

      console.log(`[gcal] Watch registrado → ${webhookUrl} (channelId: ${channelId})`);
      return true;
    } catch (error) {
      console.error("[gcal] Error registrando watch:", error);
      return false;
    }
  },

  // ===== Detener webhook watch =====
  async stopWatch(userId: string): Promise<void> {
    const connection = await prisma.calendarConnection.findFirst({
      where: { userId, activo: true },
    });
    if (!connection?.channelId || !connection?.resourceId) return;

    const auth = await getAuthenticatedClient(userId);
    if (!auth) return;

    const calendar = google.calendar({ version: "v3", auth: auth.client });
    try {
      await calendar.channels.stop({
        requestBody: {
          id: connection.channelId,
          resourceId: connection.resourceId,
        },
      });
      console.log(`[gcal] Watch detenido: ${connection.channelId}`);
    } catch (error) {
      console.error("[gcal] Error deteniendo watch:", error);
    }
  },

  // ===== Obtener eventos cambiados desde última sync (llamado al recibir webhook) =====
  async getChangedEvents(userId: string): Promise<{ googleEventId: string }[]> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return [];

    const connection = await prisma.calendarConnection.findFirst({
      where: { userId, activo: true },
    });
    if (!connection?.syncToken) {
      // Sin syncToken, inicializar y esperar al próximo cambio
      await this.initSyncToken(userId);
      return [];
    }

    const calendar = google.calendar({ version: "v3", auth: auth.client });
    try {
      const res = await calendar.events.list({
        calendarId: auth.calendarId,
        syncToken: connection.syncToken,
        showDeleted: true,
      });

      // Guardar el nuevo syncToken
      if (res.data.nextSyncToken) {
        await prisma.calendarConnection.update({
          where: { id: connection.id },
          data: { syncToken: res.data.nextSyncToken },
        });
      }

      const cancelados = (res.data.items || [])
        .filter((e) => e.id && e.status === "cancelled")
        .map((e) => ({ googleEventId: e.id! }));

      if (cancelados.length > 0) {
        console.log(`[gcal] ${cancelados.length} eventos cancelados detectados`);
      }

      return cancelados;
    } catch (error: any) {
      if (error?.code === 410) {
        // syncToken expirado — reinicializar
        console.log("[gcal] syncToken expirado, reinicializando...");
        await this.initSyncToken(userId);
      } else {
        console.error("[gcal] Error obteniendo cambios:", error);
      }
      return [];
    }
  },

  // ===== Comprobar si el watch necesita renovación (expira en < 24h) =====
  async renewWatchIfNeeded(userId: string): Promise<void> {
    const connection = await prisma.calendarConnection.findFirst({
      where: { userId, activo: true },
    });
    if (!connection?.channelExpiry) return;

    const expiresIn = connection.channelExpiry.getTime() - Date.now();
    if (expiresIn < 24 * 60 * 60 * 1000) {
      console.log("[gcal] Watch próximo a expirar, renovando...");
      await this.stopWatch(userId);
      await this.registerWatch(userId);
    }
  },

  // ===== Verificar si un evento sigue existiendo =====
  async eventExists(userId: string, eventId: string): Promise<boolean> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return true;

    const calendar = google.calendar({ version: "v3", auth: auth.client });
    try {
      const res = await calendar.events.get({
        calendarId: auth.calendarId,
        eventId,
      });
      return res.data.status !== "cancelled";
    } catch {
      return false;
    }
  },

  // ===== Detectar reservas canceladas desde Google Calendar (fallback polling) =====
  async syncDeletedEvents(userId: string): Promise<string[]> {
    const auth = await getAuthenticatedClient(userId);
    if (!auth) return [];

    const reservasConEvento = await prisma.booking.findMany({
      where: {
        googleEventId: { not: null },
        estado: { notIn: ["CANCELADA", "COMPLETADA", "NO_SHOW"] },
        fecha: { gte: new Date() },
      },
      select: { id: true, googleEventId: true },
    });

    if (reservasConEvento.length === 0) return [];

    const canceladas: string[] = [];
    const calendar = google.calendar({ version: "v3", auth: auth.client });

    for (const reserva of reservasConEvento) {
      try {
        const res = await calendar.events.get({
          calendarId: auth.calendarId,
          eventId: reserva.googleEventId!,
        });
        if (res.data.status === "cancelled") canceladas.push(reserva.id);
      } catch {
        canceladas.push(reserva.id);
      }
    }

    return canceladas;
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
