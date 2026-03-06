import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/db.js";
import { requireAuth } from "../../common/auth.middleware.js";
import { handleValidationError, handleServerError } from "../../common/errors.js";
import { googleCalendar } from "../../integrations/google-calendar/index.js";

export const availabilityRouter = Router();

// ===== SCHEMAS =====
const ruleSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  activo: z.boolean().default(true),
  userId: z.string().nullable().optional(),
});

// ===== GET /api/availability/rules — listar reglas =====
availabilityRouter.get("/rules", async (_req, res) => {
  try {
    const rules = await prisma.availabilityRule.findMany({
      where: { activo: true },
      orderBy: { diaSemana: "asc" },
    });
    res.json(rules);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== POST /api/availability/rules — crear regla (autenticado) =====
availabilityRouter.post("/rules", requireAuth, async (req, res) => {
  try {
    const data = ruleSchema.parse(req.body);
    const rule = await prisma.availabilityRule.create({ data });
    res.status(201).json(rule);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== PUT /api/availability/rules/:id — actualizar regla =====
availabilityRouter.put("/rules/:id", requireAuth, async (req, res) => {
  try {
    const data = ruleSchema.partial().parse(req.body);
    const rule = await prisma.availabilityRule.update({
      where: { id: req.params.id },
      data,
    });
    res.json(rule);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== DELETE /api/availability/rules/:id =====
availabilityRouter.delete("/rules/:id", requireAuth, async (req, res) => {
  try {
    await prisma.availabilityRule.delete({ where: { id: req.params.id } });
    res.json({ ok: true, mensaje: "Regla eliminada" });
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== GET /api/availability/slots?fecha=YYYY-MM-DD&serviceId=xxx =====
// Calcula los huecos disponibles para un día + servicio concreto
availabilityRouter.get("/slots", async (req, res) => {
  try {
    const { fecha, serviceId } = req.query;

    if (!fecha || !serviceId) {
      res.status(400).json({ error: "Parámetros 'fecha' y 'serviceId' requeridos" });
      return;
    }

    // 1. Buscar el servicio
    const service = await prisma.service.findUnique({
      where: { id: serviceId as string },
    });
    if (!service) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }

    // 2. Obtener el día de la semana
    const fechaDate = new Date(fecha as string);
    const diaSemana = fechaDate.getDay(); // 0=domingo

    // 3. Buscar regla de disponibilidad para ese día
    const rule = await prisma.availabilityRule.findFirst({
      where: { diaSemana, activo: true },
    });
    if (!rule) {
      res.json({ slots: [], mensaje: "Día no disponible" });
      return;
    }

    // 4. Obtener reservas existentes del día
    const inicioDelDia = new Date(fecha as string);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fecha as string);
    finDelDia.setHours(23, 59, 59, 999);

    const reservasExistentes = await prisma.booking.findMany({
      where: {
        fecha: { gte: inicioDelDia, lte: finDelDia },
        estado: { notIn: ["CANCELADA"] },
      },
      select: { fecha: true, fechaFin: true },
    });

    // 4b. Obtener eventos de Google Calendar (si hay conexión)
    let eventosGCal: { inicio: Date; fin: Date }[] = [];
    if (googleCalendar.isConfigured()) {
      // Buscar el primer admin con conexión activa
      const adminConnection = await prisma.calendarConnection.findFirst({
        where: { activo: true },
        select: { userId: true },
      });
      if (adminConnection) {
        eventosGCal = await googleCalendar.listEvents(adminConnection.userId, fecha as string);
        console.log(`[slots] ${eventosGCal.length} eventos de Google Calendar encontrados para ${fecha}`);
      }
    }

    // 5. Generar slots disponibles
    const slots: { hora: string; disponible: boolean }[] = [];
    const [horaIni, minIni] = rule.horaInicio.split(":").map(Number);
    const [horaFin, minFin] = rule.horaFin.split(":").map(Number);
    const duracionTotal = service.duracion + service.buffer;

    let cursor = horaIni * 60 + minIni;
    const limite = horaFin * 60 + minFin;

    while (cursor + service.duracion <= limite) {
      const slotInicio = new Date(fecha as string);
      slotInicio.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);

      const slotFin = new Date(slotInicio);
      slotFin.setMinutes(slotFin.getMinutes() + service.duracion);

      // Comprobar conflictos con reservas existentes
      const conflicto = reservasExistentes.some((r) => {
        return slotInicio < r.fechaFin && slotFin > r.fecha;
      });

      // Comprobar conflictos con eventos de Google Calendar
      const conflictoGCal = eventosGCal.some((e) => {
        return slotInicio < e.fin && slotFin > e.inicio;
      });

      slots.push({
        hora: `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
        disponible: !conflicto && !conflictoGCal,
      });

      cursor += duracionTotal;
    }

    res.json({ fecha, serviceId, slots });
  } catch (error) {
    handleServerError(error, res);
  }
});
