// Integración con WhatsApp Cloud API (Meta Business Platform)
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Configurar en .env:
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
//
// Funciones a implementar:
//   - sendTemplate(phoneNumber, templateName, params) → envía plantilla aprobada
//   - sendText(phoneNumber, message)                  → envía mensaje de texto
//   - sendConfirmation(booking)                       → confirmación de reserva
//   - sendReminder(booking)                           → recordatorio de cita

export const whatsappService = {
  isConfigured(): boolean {
    return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  },
};
