import { db } from "@/db";
import { attendance, financialTransactions, events, pastoralVisits, counselingSessions, members, visitors } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, count, sum, sql, between, desc } from "drizzle-orm"; // 👈 AGREGA 'desc' AQUÍ

// Helper para calcular fechas según el período
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (period) {
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quincena':
      if (now.getDate() <= 15) {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), 15);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 16);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      break;
    case 'week':
    default:
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date(now.setDate(diff + 6));
      break;
  }
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "year";
    
    const { start, end } = getDateRange(period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // 1. Asistencia (Se mantiene para el reporte general)
    const attendanceCount = await db
      .select({ count: count() })
      .from(attendance)
      .where(and(
        gte(attendance.attendanceDate, startStr),
        lte(attendance.attendanceDate, endStr),
        eq(attendance.isPresent, true)
      ));

    // 2. Finanzas - INGRESOS (Diezmos + Ofrendas + Donaciones)
    const incomeTotal = await db
      .select({ total: sum(financialTransactions.amount) })
      .from(financialTransactions)
      .where(and(
        gte(financialTransactions.transactionDate, startStr),
        lte(financialTransactions.transactionDate, endStr),
        sql`${financialTransactions.type} IN ('tithe', 'offering', 'donation')`
      ));

    // 3. Finanzas - GASTOS
    const expenseTotal = await db
      .select({ total: sum(financialTransactions.amount) })
      .from(financialTransactions)
      .where(and(
        gte(financialTransactions.transactionDate, startStr),
        lte(financialTransactions.transactionDate, endStr),
        eq(financialTransactions.type, 'expense')
      ));

    // 4. Eventos
    const eventsCount = await db
      .select({ count: count() })
      .from(events)
      .where(and(
        gte(events.startDate, start),
        lte(events.startDate, end)
      ));

    // 5. Consejerías
    const counselingCount = await db
      .select({ count: count() })
      .from(counselingSessions)
      .where(and(
        gte(counselingSessions.sessionDate, start),
        lte(counselingSessions.sessionDate, end)
      ));

    // 6. Visitas Pastorales
    const pastoralCount = await db
      .select({ count: count() })
      .from(pastoralVisits)
      .where(and(
        gte(pastoralVisits.visitDate, start),
        lte(pastoralVisits.visitDate, end)
      ));

    // 7. Nuevos Miembros y Visitantes
    const newMembers = await db
      .select({ count: count() })
      .from(members)
      .where(and(
        gte(members.createdAt, start),
        lte(members.createdAt, end)
      ));

    const newVisitors = await db
      .select({ count: count() })
      .from(visitors)
      .where(and(
        gte(visitors.createdAt, start),
        lte(visitors.createdAt, end)
      ));

    // 8. Datos para el gráfico de distribución (Pie Chart)
    const titheTotal = await db
      .select({ total: sum(financialTransactions.amount) })
      .from(financialTransactions)
      .where(and(
        gte(financialTransactions.transactionDate, startStr),
        lte(financialTransactions.transactionDate, endStr),
        eq(financialTransactions.type, 'tithe')
      ));

    const offeringTotal = await db
      .select({ total: sum(financialTransactions.amount) })
      .from(financialTransactions)
      .where(and(
        gte(financialTransactions.transactionDate, startStr),
        lte(financialTransactions.transactionDate, endStr),
        eq(financialTransactions.type, 'offering')
      ));

    const donationTotal = await db
      .select({ total: sum(financialTransactions.amount) })
      .from(financialTransactions)
      .where(and(
        gte(financialTransactions.transactionDate, startStr),
        lte(financialTransactions.transactionDate, endStr),
        eq(financialTransactions.type, 'donation')
      ));

    // 9. Top 5 Miembros más fieles (en aportes)
    const topMembers = await db
      .select({
        memberId: financialTransactions.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
        total: sum(financialTransactions.amount),
      })
      .from(financialTransactions)
      .leftJoin(members, eq(financialTransactions.memberId, members.id))
      .where(and(
        gte(financialTransactions.transactionDate, startStr),
        lte(financialTransactions.transactionDate, endStr),
        sql`${financialTransactions.memberId} IS NOT NULL`
      ))
      .groupBy(financialTransactions.memberId, members.id)
      .orderBy(desc(sum(financialTransactions.amount)))
      .limit(5);

    return NextResponse.json({
      period,
      dateRange: { start: startStr, end: endStr },
      data: {
        attendance: attendanceCount[0]?.count || 0,
        income: parseFloat(incomeTotal[0]?.total || "0"),
        expense: parseFloat(expenseTotal[0]?.total || "0"),
        events: eventsCount[0]?.count || 0,
        counseling: counselingCount[0]?.count || 0,
        pastoral: pastoralCount[0]?.count || 0,
        newMembers: newMembers[0]?.count || 0,
        newVisitors: newVisitors[0]?.count || 0,
        incomeDistribution: {
          tithe: parseFloat(titheTotal[0]?.total || "0"),
          offering: parseFloat(offeringTotal[0]?.total || "0"),
          donation: parseFloat(donationTotal[0]?.total || "0"),
        },
        topMembers,
      }
    });
  } catch (error) {
    console.error("Error en Reportes Globales:", error);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}