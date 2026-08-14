import { db } from "@/db";
import { users, members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_super_secreta_cambia_esto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // 1. Buscar el usuario en Neon DB
    const userResult = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        username: users.username,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
        firstName: members.firstName,
        lastName: members.lastName,
        photoUrl: members.photoUrl,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(ilike(users.username, cleanUsername))
      .limit(1);

    const userData = userResult[0];

    // 🛡️ 1.1 Validar existencia (Mensaje genérico para evitar enumeración de usuarios)
    if (!userData) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // 🚀 1.2 Optimización de CPU: Verificar estado activo ANTES de ejecutar bcrypt
    if (!userData.isActive) {
      return NextResponse.json(
        { error: "Cuenta inactiva. Contacte al administrador." },
        { status: 403 }
      );
    }

    // 2. Verificar contraseña hash
    const isValid = await bcrypt.compare(password, userData.passwordHash || "");
    if (!isValid) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // 3. Generar Token JWT
    const token = jwt.sign(
      { 
        id: userData.id, 
        memberId: userData.memberId, 
        role: userData.role,
        username: userData.username 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Guardar Cookie de Sesión (Sobrescribe directamente, sin llamados redundantes a delete)
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    // 5. Respuesta limpia al frontend
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        memberId: userData.memberId,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        photoUrl: userData.photoUrl,
      },
    });
  } catch (error) {
    console.error("Error en POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}