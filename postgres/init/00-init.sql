-- Scripts de inicialización opcionales para PostgreSQL
-- Se ejecutan automáticamente la primera vez que se crea el contenedor
-- (montados en /docker-entrypoint-initdb.d)
--
-- No necesario si usas Prisma migrate — Prisma gestiona el esquema.
-- Úsalo solo para extensiones o configuraciones de BD.

-- Ejemplo: habilitar extensión uuid-ossp (no necesaria con cuid de Prisma)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
