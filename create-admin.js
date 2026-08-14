import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Cargar variables preferentemente desde .env.local (estándar de Next.js)
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

async function main() {
  console.log("🚀 Conectando a Neon...");

  const dbUrl = process.env.DATABASE_URL;

  // 1. Validar que exista la URL de la base de datos
  if (!dbUrl) {
    console.error("❌ ERROR: La variable DATABASE_URL no está definida.");
    console.error("💡 Revisa que tu archivo .env.local contenga: DATABASE_URL=postgresql://...");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    const username = "admin";
    const email = "admin@iglesia.com";
    const rawPassword = "admin123"; // Contraseña por defecto para iniciar sesión

    console.log("🔑 Generando hash de contraseña...");
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    const role = "admin";
    const isActive = true;

    console.log("⏳ Creando / Actualizando usuario administrador...");

    // 2. Ejecutar inserción / actualización
    const result = await sql`
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES (${username}, ${email}, ${passwordHash}, ${role}, ${isActive})
      ON CONFLICT (email) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active
      RETURNING id, username, email, role;
    `;

    console.log("\n==========================================");
    console.log("✅ ¡ADMINISTRADOR CREADO / ACTUALIZADO!");
    console.log("==========================================");
    console.log(` ID:       ${result[0].id}`);
    console.log(` Usuario:  ${result[0].username}`);
    console.log(` Email:    ${result[0].email}`);
    console.log(` Rol:      ${result[0].role}`);
    console.log(` Password: ${rawPassword}`);
    console.log("==========================================\n");

  } catch (error) {
    console.error("\n❌ ERROR AL CREAR EL ADMIN:");

    // Detalles genéricos de PostgreSQL
    if (error.code) console.error("📌 Código PG Error:", error.code);
    if (error.detail) console.error("📌 Detalle PG:", error.detail);
    if (error.hint) console.error("💡 Pista PG:", error.hint);
    if (error.message) console.error("💬 Mensaje:", error.message);

    // Ayuda contextual para errores comunes
    if (error.code === '42703') {
      console.error("\n💡 Sugerencia: Una columna no existe en PostgreSQL. Revisa si en la tabla se llama 'password' o 'passwordHash' en vez de 'password_hash', o 'isActive' en vez de 'is_active'.");
    } else if (error.code === '42P01') {
      console.error("\n💡 Sugerencia: La tabla 'users' no existe en la base de datos.");
    }
  }
}

main();