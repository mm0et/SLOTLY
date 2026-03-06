import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/db.js";
import { requireAuth } from "../../common/auth.middleware.js";
import { handleValidationError, handleServerError } from "../../common/errors.js";

export const customersRouter = Router();

// ===== SCHEMAS =====
const customerSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  apellidos: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  notas: z.string().nullable().optional(),
});

// ===== GET /api/customers — listar (autenticado) =====
customersRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(customers);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== GET /api/customers/:id =====
customersRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { bookings: { orderBy: { fecha: "desc" }, take: 10 } },
    });
    if (!customer) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.json(customer);
  } catch (error) {
    handleServerError(error, res);
  }
});

// ===== POST /api/customers — crear (público, usado por el wizard de reservas) =====
customersRouter.post("/", async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== PUT /api/customers/:id — actualizar =====
customersRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data,
    });
    res.json(customer);
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== DELETE /api/customers/:id =====
customersRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ ok: true, mensaje: "Cliente eliminado" });
  } catch (error) {
    handleServerError(error, res);
  }
});
