import { db } from "@/db";
import { ministryMembers } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";

// GET - Obtener miembros de un ministerio
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministryId = parseInt(id);

    if (isNaN(ministryId)) {
      return NextResponse.json({ error: "ID de ministerio inválido" }, { status: 400 });
    }

    const members = await db
      .select({
        memberId: ministryMembers.memberId,
      })
      .from(ministryMembers)
      .where(
        and(
          eq(ministryMembers.ministryId, ministryId),
          eq(ministryMembers.isActive, true)
        )
      );

    const memberIds = members.map(m => m.memberId);

    return NextResponse.json({ memberIds });
  } catch (error) {
    console.error('Error fetching ministry members:', error);
    return NextResponse.json(
      { error: "Error al obtener los miembros del ministerio" },
      { status: 500 }
    );
  }
}

// PUT - Asignar/actualizar miembros de un ministerio
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministryId = parseInt(id);

    if (isNaN(ministryId)) {
      return NextResponse.json({ error: "ID de ministerio inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { memberIds } = body;

    if (!Array.isArray(memberIds)) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs de miembros" },
        { status: 400 }
      );
    }

    // Eliminar todos los miembros actuales del ministerio
    await db
      .delete(ministryMembers)
      .where(eq(ministryMembers.ministryId, ministryId));

    // Insertar los nuevos miembros
    if (memberIds.length > 0) {
      const newMembersData = memberIds.map((memberId: number) => ({
        ministryId: ministryId,
        memberId: Number(memberId),
        isActive: true,
        joinDate: new Date().toISOString().split('T')[0],
        role: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(ministryMembers).values(newMembersData);
    }

    // Obtener el conteo actualizado
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ministryMembers)
      .where(
        and(
          eq(ministryMembers.ministryId, ministryId),
          eq(ministryMembers.isActive, true)
        )
      );

    const memberCount = Number(countResult[0]?.count) || 0;

    return NextResponse.json({
      success: true,
      message: "Miembros asignados correctamente",
      memberCount
    });

  } catch (error) {
    console.error('Error updating ministry members:', error);
    return NextResponse.json(
      { error: "Error al actualizar los miembros del ministerio" },
      { status: 500 }
    );
  }
}