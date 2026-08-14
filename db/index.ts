import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Inicializamos la conexión HTTP rápida y optimizada para Neon
const sql = neon(databaseUrl);

// Exportamos la instancia de la base de datos con el esquema cargado
export const db = drizzle(sql, { schema });