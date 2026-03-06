import { ZodError } from "zod";
import type { Response } from "express";

/** Maneja errores de validación Zod y devuelve 400 con detalles */
export function handleValidationError(error: unknown, res: Response): boolean {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Datos inválidos",
      detalles: error.errors.map((e) => ({
        campo: e.path.join("."),
        mensaje: e.message,
      })),
    });
    return true;
  }
  return false;
}

/** Respuesta genérica de error del servidor */
export function handleServerError(error: unknown, res: Response) {
  console.error("[ERROR]", error);
  res.status(500).json({ error: "Error interno del servidor" });
}
