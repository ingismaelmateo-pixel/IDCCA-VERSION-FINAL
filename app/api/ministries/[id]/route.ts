import { db } from "@/db";
import { ministries, ministryMembers } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

// GET individual ministry
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

    const [ministry] = await db
      .select({
        id: ministries.id,
        name: ministries.name,
        description: ministries.description,
        leaderId: ministries.leaderId,
        subLeaderId: ministries.subLeaderId,
        type: ministries.type,
        status: ministries.status,
        meetingDay: ministries.meetingDay,
        meetingTime: ministries.meetingTime,
        meetingLocation: ministries.meetingLocation,
        meetingFrequency: ministries.meetingFrequency,
        objectives: ministries.objectives,
        vision: ministries.vision,
        goals: ministries.goals,
        budget: ministries.budget,
        isActive: ministries.isActive,
        email: ministries.email,
        phone: ministries.phone,
        photoUrl: ministries.photoUrl,
        observations: ministries.observations,
        createdAt: ministries.createdAt,
        updatedAt: ministries.updatedAt,
        memberCount: sql<number>`CAST(COALESCE((
          SELECT COUNT(*) FROM ${ministryMembers} 
          WHERE ${ministryMembers.ministryId} = ${ministries.id} AND ${ministryMembers.isActive} = true
        ), 0) AS INTEGER)`,
        leaderName: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name) FROM members 
          WHERE id = ${ministries.leaderId}
        )`,
        subLeaderName: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name) FROM members 
          WHERE id = ${ministries.subLeaderId}
        )`,
      })
      .from(ministries)
      .where(eq(ministries.id, ministryId));

    if (!ministry) {
      return NextResponse.json({ error: "Ministerio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(ministry);
  } catch (error) {
    console.error('Error fetching ministry:', error);
    return NextResponse.json({ error: "Error al obtener el ministerio" }, { status: 500 });
  }
}

// UPDATE ministry
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

    const [existing] = await db
      .select({ id: ministries.id })
      .from(ministries)
      .where(eq(ministries.id, ministryId));

    if (!existing) {
      return NextResponse.json({ error: "Ministerio no encontrado" }, { status: 404 });
    }

    const dataToUpdate: any = {
      updatedAt: new Date(),
    };

    const fields = [
      'name', 'description', 'type', 'status',
      'meetingDay', 'meetingTime', 'meetingLocation', 'meetingFrequency',
      'objectives', 'vision', 'goals', 'budget',
      'isActive', 'email', 'phone', 'photoUrl', 'observations'
    ];

    fields.forEach(field => {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field] === '' ? null : body[field];
      }
    });

    if (body.leaderId !== undefined) {
      dataToUpdate.leaderId = (body.leaderId && !isNaN(Number(body.leaderId)))
        ? Number(body.leaderId)
        : null;
    }

    if (body.subLeaderId !== undefined) {
      dataToUpdate.subLeaderId = (body.subLeaderId && !isNaN(Number(body.subLeaderId)))
        ? Number(body.subLeaderId)
        : null;
    }

    await db
      .update(ministries)
      .set(dataToUpdate)
      .where(eq(ministries.id, ministryId));

    // Obtener el ministerio actualizado
    const [completeMinistry] = await db
      .select({
        id: ministries.id,
        name: ministries.name,
        description: ministries.description,
        leaderId: ministries.leaderId,
        subLeaderId: ministries.subLeaderId,
        type: ministries.type,
        status: ministries.status,
        meetingDay: ministries.meetingDay,
        meetingTime: ministries.meetingTime,
        meetingLocation: ministries.meetingLocation,
        meetingFrequency: ministries.meetingFrequency,
        objectives: ministries.objectives,
        vision: ministries.vision,
        goals: ministries.goals,
        budget: ministries.budget,
        isActive: ministries.isActive,
        email: ministries.email,
        phone: ministries.phone,
        photoUrl: ministries.photoUrl,
        observations: ministries.observations,
        createdAt: ministries.createdAt,
        updatedAt: ministries.updatedAt,
        memberCount: sql<number>`CAST(COALESCE((
          SELECT COUNT(*) FROM ${ministryMembers} 
          WHERE ${ministryMembers.ministryId} = ${ministries.id} AND ${ministryMembers.isActive} = true
        ), 0) AS INTEGER)`,
        leaderName: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name) FROM members 
          WHERE id = ${ministries.leaderId}
        )`,
        subLeaderName: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name) FROM members 
          WHERE id = ${ministries.subLeaderId}
        )`,
      })
      .from(ministries)
      .where(eq(ministries.id, ministryId));

    return NextResponse.json({
      success: true,
      message: "Ministerio actualizado correctamente",
      ministry: completeMinistry
    });

  } catch (error) {
    console.error('Error updating ministry:', error);
    return NextResponse.json(
      { error: "Error al actualizar el ministerio" },
      { status: 500 }
    );
  }
}

// DELETE ministry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ministryId = parseInt(id);

    if (isNaN(ministryId)) {
      return NextResponse.json({ error: "ID de ministerio inválido" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: ministries.id })
      .from(ministries)
      .where(eq(ministries.id, ministryId));

    if (!existing) {
      return NextResponse.json({ error: "Ministerio no encontrado" }, { status: 404 });
    }

    const membersCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ministryMembers)
      .where(eq(ministryMembers.ministryId, ministryId));

    const activeMembersCount = Number(membersCount[0]?.count) || 0;

    if (activeMembersCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el ministerio porque tiene ${activeMembersCount} miembros activos. Primero debes eliminar o reasignar los miembros.`,
          memberCount: activeMembersCount
        },
        { status: 400 }
      );
    }

    await db.delete(ministries).where(eq(ministries.id, ministryId));

    return NextResponse.json({
      success: true,
      message: "Ministerio eliminado exitosamente"
    });

  } catch (error) {
    console.error('Error deleting ministry:', error);
    return NextResponse.json(
      { error: "Error al eliminar el ministerio" },
      { status: 500 }
    );
  }
}