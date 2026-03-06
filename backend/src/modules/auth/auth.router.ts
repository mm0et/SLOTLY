import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../common/db.js";
import { config } from "../../config/index.js";
import { handleValidationError, handleServerError } from "../../common/errors.js";
import { requireAuth, type AuthRequest } from "../../common/auth.middleware.js";

export const authRouter = Router();

// ===== SCHEMAS =====
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  nombre: z.string().min(1, "Nombre requerido"),
});

// ===== POST /api/auth/login =====
authRouter.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    if (!user.activo) {
      res.status(403).json({ error: "Cuenta desactivada" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    });
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== POST /api/auth/register =====
authRouter.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existe = await prisma.user.findUnique({ where: { email: data.email } });

    if (existe) {
      res.status(409).json({ error: "El email ya está registrado" });
      return;
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hash },
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    });
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== GET /api/auth/me =====
authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json({ user });
  } catch (error) {
    handleServerError(error, res);
  }
});
