import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/db.js";
import { requireAuth } from "../../common/auth.middleware.js";
import { handleValidationError, handleServerError } from "../../common/errors.js";

export const servicesRouter = Router();

// ===== SCHEMAS =====
const serviceSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  duracion: z.number().int().positive("Duración debe ser positiva"),
  precio: z.number().nonnegative("Precio no puede ser negativo"),
  buffer: z.number().int().nonnegative().default(0),
  color: z.string().default("#e94560"),
  activo: z.boolean().default(true),
  descripcion: z.string().nullable().optional(),
});

// ===== GET /api/services — listar servicios (público) =====
servicesRouter.get("/", async (_req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });
    res.json(services);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== GET /api/services/:id =====
servicesRouter.get("/:id", async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.json(service);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== POST /api/services — crear (autenticado) =====
servicesRouter.post("/", requireAuth, async (req, res) => {
  try {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({ data });
    res.status(201).json(service);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== PUT /api/services/:id — actualizar (autenticado) =====
servicesRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data,
    });
    res.json(service);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== DELETE /api/services/:id — desactivar (autenticado) =====
servicesRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    await prisma.service.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    res.json({ ok: true, mensaje: "Servicio desactivado" });
  } catch (error) {
    handleServerError(error, res);
  }
});
