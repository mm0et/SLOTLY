import type { BookingEmailData } from "./index.js";

// ===== HELPERS =====
function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 0; }
    .wrapper { padding: 32px 16px; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .body { padding: 32px; color: #333; line-height: 1.7; }
    .body h2 { margin: 0 0 8px; font-size: 20px; color: #1a1a2e; }
    .body p { margin: 0 0 16px; }
    .detail-box { background: #f8f9fc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #e94560; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-weight: 500; color: #1a1a2e; }
    .cta { display: inline-block; background: #e94560; color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 8px; }
    .footer { padding: 20px 32px; background: #f8f9fc; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .code { font-family: 'Courier New', monospace; background: #1a1a2e; color: #e94560; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 700; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
      <div class="footer">
        <p style="margin:0">Muerte o Gloria Barbershop — Sistema de citas</p>
        <p style="margin:4px 0 0;font-size:11px;color:#bbb">Este es un email automático, no respondas a este mensaje.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ===== TEMPLATE: CONFIRMACIÓN =====
export function renderConfirmacion(data: BookingEmailData): string {
  const fecha = formatFecha(data.fecha);
  const horaInicio = formatHora(data.fecha);
  const horaFin = formatHora(data.fechaFin);

  return layout(`
    <div class="header">
      <div class="icon">✅</div>
      <h1>¡Reserva Confirmada!</h1>
    </div>
    <div class="body">
      <h2>Hola ${data.clienteNombre} 👋</h2>
      <p>Tu cita ha sido confirmada correctamente. Aquí tienes los detalles:</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">📋 Servicio</span>
          <span class="detail-value">${data.servicioNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📅 Fecha</span>
          <span class="detail-value">${fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora</span>
          <span class="detail-value">${horaInicio} — ${horaFin}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🆔 Código</span>
          <span class="detail-value"><span class="code">${data.bookingId.slice(-8).toUpperCase()}</span></span>
        </div>
        ${data.notas ? `
        <div class="detail-row">
          <span class="detail-label">📝 Notas</span>
          <span class="detail-value">${data.notas}</span>
        </div>` : ""}
      </div>

      <p style="font-size:14px;color:#666">Si necesitas cancelar o modificar tu cita, contacta con nosotros lo antes posible.</p>
    </div>
  `);
}

// ===== TEMPLATE: RECORDATORIO =====
export function renderRecordatorio(data: BookingEmailData, tipo: "24h" | "1h"): string {
  const fecha = formatFecha(data.fecha);
  const horaInicio = formatHora(data.fecha);
  const horaFin = formatHora(data.fechaFin);
  const tiempoTexto = tipo === "24h" ? "mañana" : "en 1 hora";
  const emoji = tipo === "24h" ? "📅" : "⏰";

  return layout(`
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <div class="icon">${emoji}</div>
      <h1>Recordatorio de tu cita</h1>
    </div>
    <div class="body">
      <h2>Hola ${data.clienteNombre} 👋</h2>
      <p>Te recordamos que tienes una cita <strong>${tiempoTexto}</strong>:</p>

      <div class="detail-box" style="border-left-color: #f59e0b;">
        <div class="detail-row">
          <span class="detail-label">📋 Servicio</span>
          <span class="detail-value">${data.servicioNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📅 Fecha</span>
          <span class="detail-value">${fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora</span>
          <span class="detail-value">${horaInicio} — ${horaFin}</span>
        </div>
      </div>

      <p style="font-size:14px;color:#666">¡Te esperamos! Si no puedes asistir, avísanos con tiempo para que otro cliente pueda usar el hueco.</p>
    </div>
  `);
}

// ===== TEMPLATE: CANCELACIÓN =====
export function renderCancelacion(data: BookingEmailData): string {
  const fecha = formatFecha(data.fecha);
  const horaInicio = formatHora(data.fecha);

  return layout(`
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
      <div class="icon">❌</div>
      <h1>Reserva Cancelada</h1>
    </div>
    <div class="body">
      <h2>Hola ${data.clienteNombre}</h2>
      <p>Tu cita ha sido cancelada:</p>

      <div class="detail-box" style="border-left-color: #dc2626;">
        <div class="detail-row">
          <span class="detail-label">📋 Servicio</span>
          <span class="detail-value">${data.servicioNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📅 Fecha</span>
          <span class="detail-value">${fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora</span>
          <span class="detail-value">${horaInicio}</span>
        </div>
      </div>

      <p>Si deseas reservar una nueva cita, puedes hacerlo en cualquier momento.</p>
    </div>
  `);
}
