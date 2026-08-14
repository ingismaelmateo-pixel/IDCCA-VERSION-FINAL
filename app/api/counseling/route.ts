import { db } from "@/db";
import { counselingSessions, members, counselingTypeEnum } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, like, count, desc, sql, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const counselorId = searchParams.get("counselorId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = undefined;
    
    if (memberId) whereClause = eq(counselingSessions.memberId, parseInt(memberId));
    if (counselorId) {
      const cond = eq(counselingSessions.counselorId, parseInt(counselorId));
      whereClause = whereClause ? and(whereClause, cond) : cond;
    }
    if (type) {
      const foundType = counselingTypeEnum.enumValues.find(v => v === type);
      if (foundType) {
        const cond = eq(counselingSessions.type, foundType);
        whereClause = whereClause ? and(whereClause, cond) : cond;
      }
    }
    if (status) {
      const cond = eq(counselingSessions.status, status);
      whereClause = whereClause ? and(whereClause, cond) : cond;
    }

    const sessions = await db
      .select({
        id: counselingSessions.id,
        memberId: counselingSessions.memberId,
        counselorId: counselingSessions.counselorId,
        type: counselingSessions.type,
        sessionDate: counselingSessions.sessionDate,
        duration: counselingSessions.duration,
        notes: counselingSessions.notes,
        followUpDate: counselingSessions.followUpDate,
        status: counselingSessions.status,
        isPrivate: counselingSessions.isPrivate,
        createdAt: counselingSessions.createdAt,
        updatedAt: counselingSessions.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        counselorFirstName: members.firstName,
        counselorLastName: members.lastName,
      })
      .from(counselingSessions)
      .leftJoin(members, eq(counselingSessions.memberId, members.id))
      .where(whereClause)
      .orderBy(desc(counselingSessions.sessionDate))
      .limit(limit);

    // --- KPIs ---
    const totalResult = await db.select({ count: count() }).from(counselingSessions);
    const scheduledResult = await db
      .select({ count: count() })
      .from(counselingSessions)
      .where(eq(counselingSessions.status, 'scheduled'));
    const completedResult = await db
      .select({ count: count() })
      .from(counselingSessions)
      .where(eq(counselingSessions.status, 'completed'));

    return NextResponse.json({
      sessions,
      kpis: {
        total: totalResult[0]?.count || 0,
        scheduled: scheduledResult[0]?.count || 0,
        completed: completedResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET Counseling:", error);
    return NextResponse.json({ error: "Error al cargar sesiones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, counselorId, type, sessionDate, duration, notes, followUpDate, status, isPrivate } = body;

    if (!memberId || !type || !sessionDate) {
      return NextResponse.json({ error: "Miembro, Tipo y Fecha son requeridos" }, { status: 400 });
    }

    const [newSession] = await db.insert(counselingSessions).values({
      memberId: parseInt(memberId),
      counselorId: counselorId ? parseInt(counselorId) : null,
      type: type as typeof counselingTypeEnum.enumValues[number],
      sessionDate: new Date(sessionDate),
      duration: duration ? parseInt(duration) : null,
      notes: notes || "",
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: status || 'scheduled',
      isPrivate: isPrivate !== undefined ? isPrivate : true,
    }).returning();

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error POST Counseling:", error);
    return NextResponse.json({ error: "Error al crear la sesión" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const updateData: any = {
      type: body.type,
      duration: body.duration ? parseInt(body.duration) : null,
      notes: body.notes,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      status: body.status,
      isPrivate: body.isPrivate,
    };
    if (body.sessionDate) updateData.sessionDate = new Date(body.sessionDate);

    const [updatedSession] = await db
      .update(counselingSessions)
      .set(updateData)
      .where(eq(counselingSessions.id, id))
      .returning();

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error PUT Counseling:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await db.delete(counselingSessions).where(eq(counselingSessions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Counseling:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}