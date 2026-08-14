import { db } from "@/db";
import { pastoralVisits, members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc, between, count, sql } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener visitas (con filtros por miembro, pastor y fecha)
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const pastorId = searchParams.get("pastorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "20");

    let whereClause = undefined;
    if (memberId) whereClause = eq(pastoralVisits.memberId, parseInt(memberId));
    if (pastorId) {
      const pastorCond = eq(pastoralVisits.pastorId, parseInt(pastorId));
      whereClause = whereClause ? and(whereClause, pastorCond) : pastorCond;
    }
    if (startDate && endDate) {
      const dateCond = between(pastoralVisits.visitDate, new Date(startDate), new Date(endDate));
      whereClause = whereClause ? and(whereClause, dateCond) : dateCond;
    }

    const query = await db
      .select({
        id: pastoralVisits.id,
        memberId: pastoralVisits.memberId,
        pastorId: pastoralVisits.pastorId,
        visitType: pastoralVisits.visitType,
        visitDate: pastoralVisits.visitDate,
        duration: pastoralVisits.duration,
        notes: pastoralVisits.notes,
        followUpRequired: pastoralVisits.followUpRequired,
        followUpDate: pastoralVisits.followUpDate,
        status: pastoralVisits.status,
        createdAt: pastoralVisits.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        pastorFirstName: members.firstName,
        pastorLastName: members.lastName,
      })
      .from(pastoralVisits)
      .leftJoin(members, eq(pastoralVisits.memberId, members.id))
      .where(whereClause)
      .orderBy(desc(pastoralVisits.visitDate))
      .limit(limit);

    return NextResponse.json(query);
  } catch (error) {
    console.error("Error GET Pastoral Visits:", error);
    return NextResponse.json({ error: "Error al cargar visitas" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear una nueva cita pastoral
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, pastorId, visitType, visitDate, duration, notes, followUpRequired, followUpDate, status } = body;

    if (!memberId || !visitDate) {
      return NextResponse.json({ error: "Miembro y Fecha de visita son requeridos" }, { status: 400 });
    }

    const [newVisit] = await db.insert(pastoralVisits).values({
      memberId: parseInt(memberId),
      pastorId: pastorId ? parseInt(pastorId) : null,
      visitType: visitType || "General",
      visitDate: new Date(visitDate),
      duration: duration ? parseInt(duration) : null,
      notes: notes || "",
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: status || "scheduled",
    }).returning();

    return NextResponse.json(newVisit, { status: 201 });
  } catch (error) {
    console.error("Error POST Pastoral Visits:", error);
    return NextResponse.json({ error: "Error al crear la visita" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PATCH: Actualizar el estado de una cita (Ej: de "scheduled" a "completed")
// ----------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const [updatedVisit] = await db
      .update(pastoralVisits)
      .set({
        status: body.status,
        notes: body.notes,
        followUpRequired: body.followUpRequired,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      })
      .where(eq(pastoralVisits.id, id))
      .returning();

    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("Error PATCH Pastoral Visits:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar una cita pastoral
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.delete(pastoralVisits).where(eq(pastoralVisits.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Pastoral Visits:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}