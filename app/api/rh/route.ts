import { db } from "@/db";
import { users, members, roleEnum } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, like, count, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = undefined;
    
    // Construir filtros dinámicamente
    if (search) {
      const searchCondition = sql`(${users.username} ILIKE ${`%${search}%`} OR ${members.firstName} ILIKE ${`%${search}%`} OR ${members.lastName} ILIKE ${`%${search}%`})`;
      whereClause = searchCondition;
    }

    if (role) {
      const foundRole = roleEnum.enumValues.find(v => v === role);
      if (foundRole) {
        const roleCondition = eq(users.role, foundRole);
        whereClause = whereClause ? sql`${whereClause} AND ${roleCondition}` : roleCondition;
      }
    }

    // Obtener lista de usuarios con datos de miembro
    const staffList = await db
      .select({
        id: users.id,
        memberId: users.memberId,
        username: users.username,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        firstName: members.firstName,
        lastName: members.lastName,
        photoUrl: members.photoUrl,
        phone: members.cellPhone,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    // --- CÁLCULO DE KPIs ---
    const totalStaffResult = await db
      .select({ count: count() })
      .from(users);

    const activeStaffResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    const adminCountResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'));

    return NextResponse.json({
      staff: staffList,
      kpis: {
        total: totalStaffResult[0]?.count || 0,
        active: activeStaffResult[0]?.count || 0,
        admins: adminCountResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET HR:", error);
    return NextResponse.json({ error: "Error al cargar personal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, username, email, passwordHash, role } = body;

    if (!memberId || !username || !email || !role) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Verificar si el username ya existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 });
    }

    const [newStaff] = await db.insert(users).values({
      memberId: parseInt(memberId),
      username,
      email,
      passwordHash: passwordHash || "temporal123", // En producción, usa bcrypt
      role: role as typeof roleEnum.enumValues[number],
      isActive: true,
    }).returning();

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error("Error POST HR:", error);
    return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const [updatedStaff] = await db
      .update(users)
      .set({
        role: body.role,
        isActive: body.isActive,
        username: body.username,
        email: body.email,
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error PUT HR:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE HR:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}