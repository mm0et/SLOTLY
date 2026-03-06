import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config/index.js";

// Routers
import { authRouter } from "./modules/auth/auth.router.js";
import { servicesRouter } from "./modules/services/services.router.js";
import { customersRouter } from "./modules/customers/customers.router.js";
import { availabilityRouter } from "./modules/availability/availability.router.js";
import { bookingsRouter } from "./modules/bookings/bookings.router.js";
import { calendarsRouter } from "./modules/calendars/calendars.router.js";
import { remindersRouter } from "./modules/reminders/reminders.router.js";
import { notificationsRouter } from "./modules/notifications/notifications.router.js";
import { startScheduler } from "./scheduler/index.js";

const app = express();

// ===== MIDDLEWARE GLOBAL =====
app.use(cors({ origin: "*" })); // TODO: restringir en producción
app.use(express.json());

// ===== HEALTH CHECK =====
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== RUTAS =====
app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/customers", customersRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/calendars", calendarsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/notifications", notificationsRouter);

// ===== ARRANCAR SERVIDOR =====
app.listen(config.port, () => {
  console.log(`[reservas-backend] Servidor corriendo en puerto ${config.port}`);
  console.log(`[reservas-backend] Health check → http://localhost:${config.port}/api/health`);

  // Arrancar scheduler de recordatorios
  startScheduler();
});
