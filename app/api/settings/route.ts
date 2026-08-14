import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc, count } from "drizzle-orm";
import bcrypt from 'bcryptjs';

// ----------------------------------------------------------------------
// GET: Obtener datos de Auditoría y Roles
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    // 1. Obtener los últimos 50 registros de auditoría
    const logs = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        tableName: auditLog.tableName,
        recordId: auditLog.recordId,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(50);

    // 2. Obtener el conteo de usuarios por rol (para la sección de Roles)
    const roleCounts = await db
      .select({
        role: users.role,
        count: count(users.id),
      })
      .from(users)
      .groupBy(users.role);

    return NextResponse.json({
      logs,
      roleCounts,
    });
  } catch (error) {
    console.error("Error GET Settings:", error);
    return NextResponse.json({ error: "Error al cargar configuración" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Cambiar contraseña del usuario
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Buscar el usuario en la base de datos
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Verificar la contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user[0].passwordHash || "");
    if (!isValid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 });
    }

    // 3. Hash de la nueva contraseña y actualizar
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error POST Settings:", error);
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 });
  }
}