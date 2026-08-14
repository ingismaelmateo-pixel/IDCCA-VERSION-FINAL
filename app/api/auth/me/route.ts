import { db } from "@/db";
import { users, members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_super_secreta_cambia_esto";

interface JwtPayload {
  id: string | number;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verificar token JWT
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Asegurar que el ID sea numérico para Drizzle
    const userId = Number(decoded.id);

    if (isNaN(userId)) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Obtener datos del usuario desde la base de datos
    const result = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        username: users.username,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        firstName: members.firstName,
        lastName: members.lastName,
        photoUrl: members.photoUrl,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Error en GET /api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}