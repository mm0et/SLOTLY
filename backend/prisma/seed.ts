import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Ejecutando seed...");

  // ===== USUARIO ADMIN =====
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@barberia.com" },
    update: {},
    create: {
      email: "admin@barberia.com",
      password: passwordHash,
      nombre: "Admin",
      rol: "ADMIN",
    },
  });
  console.log(`✅ Usuario admin creado: ${admin.email}`);

  // ===== SERVICIOS (datos reales de MUERTE O GLORIA BARBERSHOP) =====
  const servicios = [
    {
      nombre: "Arreglo de barba",
      duracion: 30,
      precio: 11.50,
      color: "#10b981",
      descripcion: "Ritual de toallas italiano con afeitado a navaja. Si no es posible acudir a la cita, avisar o cancelar con la máxima antelación posible. Gracias.",
    },
    {
      nombre: "Corte de pelo",
      duracion: 30,
      precio: 14.00,
      color: "#e94560",
      descripcion: "Asesoramiento, corte y peinado. Si no es posible acudir a la cita, avisar o cancelar con la máxima antelación posible. Gracias.",
    },
    {
      nombre: "Corte y barba",
      duracion: 30,
      precio: 20.00,
      color: "#3b82f6",
      descripcion: "Asesoramiento, corte, peinado y arreglo de barba con máquina. Si no es posible acudir a la cita, avisar o cancelar con la máxima antelación posible. Gracias.",
    },
    {
      nombre: "Corte y barba premium",
      duracion: 60,
      precio: 22.00,
      color: "#8b5cf6",
      descripcion: "Asesoramiento, corte, peinado y arreglo de barba con ritual de toallas italiano y afeitado a navaja. Si no es posible acudir a la cita, avisar o cancelar con la máxima antelación posible. Gracias.",
    },
    {
      nombre: "Mant. de corte",
      duracion: 30,
      precio: 11.50,
      color: "#f59e0b",
      descripcion: "Aplicable a personas que se hayan cortado el pelo con nosotros en los 15 días anteriores. Si no es posible acudir a la cita, avisar o cancelar con la máxima antelación posible. Gracias.",
    },
  ];

  for (const s of servicios) {
    await prisma.service.upsert({
      where: { id: s.nombre.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: { ...s },
    });
  }
  console.log(`✅ ${servicios.length} servicios creados`);

  // ===== DISPONIBILIDAD (L-V 09:00-20:00, S 10:00-14:00) =====
  const horarios = [
    { diaSemana: 1, horaInicio: "09:00", horaFin: "20:00" }, // Lunes
    { diaSemana: 2, horaInicio: "09:00", horaFin: "20:00" }, // Martes
    { diaSemana: 3, horaInicio: "09:00", horaFin: "20:00" }, // Miércoles
    { diaSemana: 4, horaInicio: "09:00", horaFin: "20:00" }, // Jueves
    { diaSemana: 5, horaInicio: "09:00", horaFin: "20:00" }, // Viernes
    { diaSemana: 6, horaInicio: "10:00", horaFin: "14:00" }, // Sábado
    // Domingo cerrado → no se crea regla
  ];

  // Borrar reglas existentes y recrear
  await prisma.availabilityRule.deleteMany({});
  for (const h of horarios) {
    await prisma.availabilityRule.create({ data: h });
  }
  console.log(`✅ ${horarios.length} reglas de disponibilidad creadas`);

  console.log("🌱 Seed completado");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
