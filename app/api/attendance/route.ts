import { db } from "@/db";
import { attendance, members, visitors } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc, sql, count, between, isNotNull } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener asistencias + KPIs dinámicos para el Dashboard
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const eventId = searchParams.get("eventId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeStats = searchParams.get("includeStats") === "true" || searchParams.get("stats") === "true";

    // --- Construir cláusula WHERE dinámicamente ---
    let whereClause = undefined;

    if (memberId) {
      whereClause = eq(attendance.memberId, parseInt(memberId));
    }

    if (eventId) {
      const eventCondition = eq(attendance.eventId, parseInt(eventId));
      whereClause = whereClause ? and(whereClause, eventCondition) : eventCondition;
    }

    if (startDate && endDate) {
      const dateCondition = between(attendance.attendanceDate, startDate, endDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    } else if (startDate) {
      const dateCondition = gte(attendance.attendanceDate, startDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    }

    // --- Consulta principal de Asistencias ---
    const data = await db
      .select({
        id: attendance.id,
        memberId: attendance.memberId,
        eventId: attendance.eventId,
        ministryId: attendance.ministryId,
        attendanceDate: attendance.attendanceDate,
        serviceType: attendance.serviceType,
        isPresent: attendance.isPresent,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        // Nombres de Miembros
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberPhotoUrl: members.photoUrl,
        // Nombres de Visitantes
        visitorFirstName: visitors.firstName,
        visitorLastName: visitors.lastName,
      })
      .from(attendance)
      .leftJoin(members, eq(attendance.memberId, members.id))
      .leftJoin(visitors, eq(attendance.memberId, visitors.id))
      .where(whereClause)
      .orderBy(desc(attendance.attendanceDate))
      .limit(limit);

    // --- Formatear los datos para indicar si es 'member' o 'visitor' ---
    const formattedData = data.map((record) => {
      let firstName = record.memberFirstName;
      let lastName = record.memberLastName;
      let personType: "member" | "visitor" = "member";

      if (!firstName && !lastName) {
        firstName = record.visitorFirstName;
        lastName = record.visitorLastName;
        personType = "visitor";
      }

      return {
        ...record,
        memberFirstName: firstName || "Anónimo",
        memberLastName: lastName || "",
        personType: personType,
      };
    });

    // --- Si se solicitan estadísticas (KPIs) ---
    if (includeStats) {
      const todayStr = new Date().toISOString().split("T")[0];

      // Inicio de la semana actual (Domingo)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

      // 1. Asistencia de hoy
      const [todayResult] = await db
        .select({ count: count() })
        .from(attendance)
        .where(and(eq(attendance.attendanceDate, todayStr), eq(attendance.isPresent, true)));

      // 2. Asistencia esta semana
      const [weekResult] = await db
        .select({ count: count() })
        .from(attendance)
        .where(and(gte(attendance.attendanceDate, startOfWeekStr), eq(attendance.isPresent, true)));

      // 3. Visitantes activos registrados en total
      const [visitorResult] = await db.select({ count: count() }).from(visitors);

      // 4. Miembro con más asistencias ("Más Fiel")
      const topMemberResult = await db
        .select({
          memberId: attendance.memberId,
          total: count(),
          firstName: members.firstName,
          lastName: members.lastName,
        })
        .from(attendance)
        .leftJoin(members, eq(attendance.memberId, members.id))
        .where(and(eq(attendance.isPresent, true), isNotNull(attendance.memberId)))
        .groupBy(attendance.memberId, members.firstName, members.lastName)
        .orderBy(desc(count()))
        .limit(1);

      const mostFaithful =
        topMemberResult.length > 0 && topMemberResult[0].firstName
          ? `${topMemberResult[0].firstName} ${topMemberResult[0].lastName || ""}`.trim()
          : "—";

      return NextResponse.json({
        kpis: {
          today: todayResult?.count || 0,
          thisWeek: weekResult?.count || 0,
          avgDaily: Math.round((weekResult?.count || 0) / 7),
          activeVisitors: visitorResult?.count || 0,
          mostFaithful,
        },
        history: formattedData,
      });
    }

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error GET Attendance:", error);
    return NextResponse.json({ error: "Error al cargar asistencias" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Registrar nueva asistencia (soporta Miembros, Visitantes y Lotes)
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- REGISTRO MASIVO (Si llega una lista/array) ---
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ error: "No hay datos para registrar" }, { status: 400 });
      }

      const values = body.map((item) => ({
        memberId: parseInt(item.memberId),
        eventId: item.eventId ? parseInt(item.eventId) : null,
        ministryId: item.ministryId ? parseInt(item.ministryId) : null,
        attendanceDate: item.attendanceDate || new Date().toISOString().split("T")[0],
        serviceType: item.serviceType || "general",
        isPresent: item.isPresent !== undefined ? item.isPresent : true,
        notes: item.notes || "",
      }));

      const newAttendance = await db.insert(attendance).values(values).returning();
      return NextResponse.json(newAttendance, { status: 201 });
    }

    // --- REGISTRO INDIVIDUAL ---
    const {
      memberId,
      visitorId,
      isVisitor,
      visitorFirstName,
      visitorLastName,
      visitorPhone,
      eventId,
      ministryId,
      attendanceDate,
      serviceType,
      isPresent,
      notes,
    } = body;

    const todayDateStr = attendanceDate || new Date().toISOString().split("T")[0];
    let targetMemberId = memberId ? parseInt(memberId) : null;

    // 🚀 SI ES UN REGISTRO DE VISITANTE NUEVO:
    if (isVisitor && visitorFirstName) {
      const [newVisitor] = await db
        .insert(visitors)
        .values({
          firstName: visitorFirstName,
          lastName: visitorLastName || "",
          phone: visitorPhone || null,
        })
        .returning();

      targetMemberId = newVisitor.id;
    } else if (isVisitor && visitorId) {
      targetMemberId = parseInt(visitorId);
    }

    if (!targetMemberId) {
      return NextResponse.json(
        { error: "Se requiere un memberId o datos del visitante para registrar asistencia" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene asistencia ese mismo día
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.memberId, targetMemberId),
          eq(attendance.attendanceDate, todayDateStr)
        )
      );

    if (existing.length > 0 && eventId === undefined) {
      return NextResponse.json(
        { error: "Esta persona ya tiene una asistencia registrada en esta fecha" },
        { status: 409 }
      );
    }

    // Insertar la asistencia
    const [newAttendance] = await db
      .insert(attendance)
      .values({
        memberId: targetMemberId,
        eventId: eventId ? parseInt(eventId) : null,
        ministryId: ministryId ? parseInt(ministryId) : null,
        attendanceDate: todayDateStr,
        serviceType: serviceType || "general",
        isPresent: isPresent !== undefined ? isPresent : true,
        notes: notes || (isVisitor ? "Registro de Visitante" : ""),
      })
      .returning();

    return NextResponse.json(newAttendance, { status: 201 });
  } catch (error) {
    console.error("Error POST Attendance:", error);
    return NextResponse.json({ error: "Error al registrar asistencia" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un registro de asistencia
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID de asistencia requerido" }, { status: 400 });
    }

    await db.delete(attendance).where(eq(attendance.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Attendance:", error);
    return NextResponse.json({ error: "Error al eliminar asistencia" }, { status: 500 });
  }
}