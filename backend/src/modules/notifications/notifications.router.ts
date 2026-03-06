import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/auth.middleware.js";
import { handleValidationError, handleServerError } from "../../common/errors.js";
import { emailService } from "../../integrations/email/index.js";
import { whatsappService } from "../../integrations/whatsapp/index.js";

export const notificationsRouter = Router();

// ===== SCHEMAS =====
const sendSchema = z.object({
  canal: z.enum(["EMAIL", "WHATSAPP"]),
  destinatario: z.string().min(1, "Destinatario requerido"),
  asunto: z.string().optional(),
  mensaje: z.string().min(1, "Mensaje requerido"),
});

// ===== POST /api/notifications/send — enviar notificación =====
notificationsRouter.post("/send", requireAuth, async (req, res) => {
  try {
    const data = sendSchema.parse(req.body);

    switch (data.canal) {
      case "EMAIL": {
        if (!emailService.isConfigured()) {
          res.json({ ok: false, canal: "EMAIL", mensaje: "SMTP no configurado. Añade SMTP_HOST, SMTP_USER y SMTP_PASS en .env" });
          return;
        }
        const enviado = await emailService.sendGeneric(data.destinatario, data.asunto || "Notificación", data.mensaje);
        res.json({ ok: enviado, canal: "EMAIL", mensaje: enviado ? "Email enviado correctamente" : "Error al enviar email" });
        break;
      }

      case "WHATSAPP": {
        if (!whatsappService.isConfigured()) {
          res.json({ ok: false, canal: "WHATSAPP", mensaje: "WhatsApp no configurado. Añade WHATSAPP_TOKEN en .env" });
          return;
        }
        // TODO: implementar envío real de WhatsApp
        console.log(`[notificación] WhatsApp a ${data.destinatario}: ${data.mensaje}`);
        res.json({ ok: false, canal: "WHATSAPP", mensaje: "WhatsApp aún no implementado" });
        break;
      }
    }
  } catch (error) {
    if (!handleValidationError(error, res)) handleServerError(error, res);
  }
});

// ===== GET /api/notifications/status — estado de las integraciones =====
notificationsRouter.get("/status", requireAuth, async (_req, res) => {
  res.json({
    email: {
      configurado: emailService.isConfigured(),
      mensaje: emailService.isConfigured() ? "SMTP configurado y listo" : "Configurar SMTP_HOST, SMTP_USER y SMTP_PASS en .env",
    },
    whatsapp: {
      configurado: whatsappService.isConfigured(),
      mensaje: whatsappService.isConfigured() ? "WhatsApp configurado" : "Configurar WHATSAPP_TOKEN en .env",
    },
  });
});
