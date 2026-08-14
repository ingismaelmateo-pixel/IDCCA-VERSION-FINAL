import { db } from "@/db";
import { attendance, members, visitors } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Calcular inicio y fin de la semana en string (YYYY-MM-DD)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    // Ventana de 30 días para promedios (evita que meses viejos distorsionen el número)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // 1. Asistencia hoy
    const todayCount = await db
      .select({ count: count() })
      .from(attendance)
      .where(and(
        eq(attendance.attendanceDate, todayStr),
        eq(attendance.isPresent, true)
      ));

    // 2. Asistencia de la semana
    const weekCount = await db
      .select({ count: count() })
      .from(attendance)
      .where(and(
        gte(attendance.attendanceDate, startOfWeekStr),
        lte(attendance.attendanceDate, endOfWeekStr),
        eq(attendance.isPresent, true)
      ));

    // 3. Datos para el gráfico de los últimos 7 días
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const chartData = await Promise.all(last7Days.map(async (dateStr) => {
      const result = await db
        .select({ count: count() })
        .from(attendance)
        .where(and(
          eq(attendance.attendanceDate, dateStr),
          eq(attendance.isPresent, true)
        ));
      return {
        date: dateStr,
        count: result[0]?.count || 0
      };
    }));

    // 4. 🔥 Promedio Diario real: asistencias presentes / cantidad de días distintos
    //    con registro, en los últimos 30 días.
    const dailyCounts = await db
      .select({
        date: attendance.attendanceDate,
        count: count(),
      })
      .from(attendance)
      .where(and(
        gte(attendance.attendanceDate, thirtyDaysAgoStr),
        eq(attendance.isPresent, true)
      ))
      .groupBy(attendance.attendanceDate);

    const avgDaily = dailyCounts.length > 0
      ? Math.round(
          dailyCounts.reduce((sum, d) => sum + Number(d.count), 0) / dailyCounts.length
        )
      : 0;

    // 5. 🔥 Más Fiel: miembro con más asistencias registradas como "presente"
    const topMembersRaw = await db
      .select({
        memberId: attendance.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
        count: count(attendance.id),
      })
      .from(attendance)
      .innerJoin(members, eq(attendance.memberId, members.id))
      .where(eq(attendance.isPresent, true))
      .groupBy(attendance.memberId, members.firstName, members.lastName)
      .orderBy(desc(count(attendance.id)))
      .limit(5);

    const topMembers = topMembersRaw.map((m) => ({
      memberId: m.memberId as number,
      firstName: m.firstName,
      lastName: m.lastName,
      count: Number(m.count),
    }));

    // 6. 🔥 Visitantes Activos: visitantes registrados que aún no se han
    //    convertido en miembros (siguen siendo "potencial de crecimiento").
    const activeVisitorsCount = await db
      .select({ count: count() })
      .from(visitors)
      .where(eq(visitors.converted, false));

    return NextResponse.json({
      today: todayCount[0]?.count || 0,
      week: weekCount[0]?.count || 0,
      avgDaily,
      topMembers,
      activeVisitors: activeVisitorsCount[0]?.count || 0,
      chartData,
    });
  } catch (error) {
    console.error("Error GET Stats:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}