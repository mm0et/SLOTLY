import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { config } from "../../config/index.js";
import { renderConfirmacion, renderRecordatorio, renderCancelacion } from "./templates.js";

// ===== TIPOS =====
export interface BookingEmailData {
  clienteNombre: string;
  clienteEmail: string;
  servicioNombre: string;
  fecha: Date;
  fechaFin: Date;
  bookingId: string;
  notas?: string | null;
}

// ===== TRANSPORTER SINGLETON =====
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!emailService.isConfigured()) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    console.log(`[email] Transporter creado → ${config.smtp.host}:${config.smtp.port}`);
  }

  return transporter;
}

// ===== SERVICIO DE EMAIL =====
export const emailService = {
  isConfigured(): boolean {
    return !!(config.smtp.host && config.smtp.user && config.smtp.pass);
  },

  /** Enviar email de confirmación tras crear reserva */
  async sendConfirmation(data: BookingEmailData): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      console.log("[email] SMTP no configurado — confirmación no enviada");
      return false;
    }

    try {
      const html = renderConfirmacion(data);
      await t.sendMail({
        from: `"Muerte o Gloria Barbershop" <${config.smtp.user}>`,
        to: data.clienteEmail,
        subject: `✅ Reserva confirmada — ${data.servicioNombre}`,
        html,
      });
      console.log(`[email] Confirmación enviada a ${data.clienteEmail}`);
      return true;
    } catch (error) {
      console.error("[email] Error enviando confirmación:", error);
      return false;
    }
  },

  /** Enviar recordatorio (24h o 1h antes) */
  async sendReminder(data: BookingEmailData, tipo: "24h" | "1h"): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      console.log("[email] SMTP no configurado — recordatorio no enviado");
      return false;
    }

    try {
      const html = renderRecordatorio(data, tipo);
      const tiempoTexto = tipo === "24h" ? "mañana" : "en 1 hora";
      await t.sendMail({
        from: `"Muerte o Gloria Barbershop" <${config.smtp.user}>`,
        to: data.clienteEmail,
        subject: `⏰ Recordatorio: tu cita es ${tiempoTexto} — ${data.servicioNombre}`,
        html,
      });
      console.log(`[email] Recordatorio ${tipo} enviado a ${data.clienteEmail}`);
      return true;
    } catch (error) {
      console.error(`[email] Error enviando recordatorio ${tipo}:`, error);
      return false;
    }
  },

  /** Enviar aviso de cancelación */
  async sendCancellation(data: BookingEmailData): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      console.log("[email] SMTP no configurado — cancelación no enviada");
      return false;
    }

    try {
      const html = renderCancelacion(data);
      await t.sendMail({
        from: `"Muerte o Gloria Barbershop" <${config.smtp.user}>`,
        to: data.clienteEmail,
        subject: `❌ Reserva cancelada — ${data.servicioNombre}`,
        html,
      });
      console.log(`[email] Cancelación enviada a ${data.clienteEmail}`);
      return true;
    } catch (error) {
      console.error("[email] Error enviando cancelación:", error);
      return false;
    }
  },

  /** Enviar email genérico (para notifications router) */
  async sendGeneric(to: string, subject: string, body: string): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      console.log("[email] SMTP no configurado — email genérico no enviado");
      return false;
    }

    try {
      await t.sendMail({
        from: `"Muerte o Gloria Barbershop" <${config.smtp.user}>`,
        to,
        subject,
        html: wrapLayout(body),
      });
      console.log(`[email] Email genérico enviado a ${to}`);
      return true;
    } catch (error) {
      console.error("[email] Error enviando email genérico:", error);
      return false;
    }
  },
};

// ===== LAYOUT WRAPPER (para emails genéricos) =====
function wrapLayout(content: string): string {
  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .content { padding: 32px; color: #333; line-height: 1.6; }
    .footer { padding: 16px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #999; }
  </style></head>
  <body><div class="container">
    <div class="content">${content}</div>
    <div class="footer">Muerte o Gloria Barbershop — Sistema de citas</div>
  </div></body></html>`;
}
