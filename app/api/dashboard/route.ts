import { db } from "@/db";
import { members, visitors as visitorsSchema, financialTransactions, events, ministries, prayerRequests, attendance } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql, eq, gte, lte, and } from "drizzle-orm";

export async function GET() {
  try {
    const today = new Date();
    
    // Fechas Mes Actual
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Fechas Mes Anterior (Para calcular % reales vs mes anterior)
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const todayStr = today.toISOString().split("T")[0];
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
    const startOfYearStr = startOfYear.toISOString().split("T")[0];
    const startOfPrevMonthStr = startOfPrevMonth.toISOString().split("T")[0];
    const endOfPrevMonthStr = endOfPrevMonth.toISOString().split("T")[0];

    // Helper para calcular variación porcentual real
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      const diff = ((current - previous) / previous) * 100;
      return Number(diff.toFixed(1));
    };

    // 1. MIEMBROS TOTALES Y TENDENCIA
    const [totalMembersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(eq(members.status, "active"));

    // Usamos SQL raw para evitar inconsistencia entre createdAt y created_at en el esquema
    const [prevTotalMembersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(and(eq(members.status, "active"), lte(sql`created_at`, endOfPrevMonthStr)));

    // 2. NUEVOS MIEMBROS Y TENDENCIA
    const [newMembersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(
        and(
          eq(members.status, "active"),
          gte(members.joinDate, startOfMonthStr)
        )
      );

    const [prevNewMembersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(
        and(
          eq(members.status, "active"),
          gte(members.joinDate, startOfPrevMonthStr),
          lte(members.joinDate, endOfPrevMonthStr)
        )
      );

    // 3. BAUTISMOS
    const [baptismsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(gte(members.baptismDate, startOfYearStr));

    const [prevBaptismsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(
        and(
          gte(members.baptismDate, new Date(today.getFullYear() - 1, 0, 1).toISOString().split("T")[0]),
          lte(members.baptismDate, new Date(today.getFullYear() - 1, 11, 31).toISOString().split("T")[0])
        )
      );

    // 4. ASISTENCIA DEL MES
    const [monthAttendanceResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(gte(attendance.attendanceDate, startOfMonthStr));

    const [prevMonthAttendanceResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(
        and(
          gte(attendance.attendanceDate, startOfPrevMonthStr),
          lte(attendance.attendanceDate, endOfPrevMonthStr)
        )
      );

    // 5. DIEZMOS DEL MES VS MES ANTERIOR
    const tithesResult = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::numeric` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, "tithe"),
          gte(financialTransactions.transactionDate, startOfMonthStr)
        )
      );

    const prevTithesResult = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::numeric` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, "tithe"),
          gte(financialTransactions.transactionDate, startOfPrevMonthStr),
          lte(financialTransactions.transactionDate, endOfPrevMonthStr)
        )
      );

    // 6. OFRENDAS DEL MES VS MES ANTERIOR
    const offeringsResult = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::numeric` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, "offering"),
          gte(financialTransactions.transactionDate, startOfMonthStr)
        )
      );

    const prevOfferingsResult = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::numeric` })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, "offering"),
          gte(financialTransactions.transactionDate, startOfPrevMonthStr),
          lte(financialTransactions.transactionDate, endOfPrevMonthStr)
        )
      );

    // 7. OTROS KPIS
    const [ministriesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ministries)
      .where(eq(ministries.isActive, true));

    const [prayerResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prayerRequests)
      .where(eq(prayerRequests.status, "pending"));

    const [visitorsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visitorsSchema);

    const [prevVisitorsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visitorsSchema)
      .where(lte(sql`created_at`, endOfPrevMonthStr));

    // RECORDATORIO PASTORAL DINÁMICO
    const pendingPastoralResult = await db.execute(sql`
      SELECT COUNT(*)::int as count 
      FROM members 
      WHERE status = 'active' 
        AND id NOT IN (
          SELECT DISTINCT member_id 
          FROM pastoral_care 
          WHERE date >= ${startOfMonthStr}
        )
    `);

    // EVENTOS Y CUMPLEAÑOS
    const upcomingEvents = await db
      .select()
      .from(events)
      .where(gte(events.startDate, today))
      .limit(5);

    // CONSULTAS PARA GRÁFICOS
    const monthlyTithes = await db.execute(sql`
      SELECT 
        TO_CHAR(transaction_date::date, 'Mon') as month,
        EXTRACT(MONTH FROM transaction_date::date) as month_num,
        SUM(amount)::numeric as total
      FROM financial_transactions
      WHERE type = 'tithe'
        AND EXTRACT(YEAR FROM transaction_date::date) = ${today.getFullYear()}
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    const monthlyOfferings = await db.execute(sql`
      SELECT 
        TO_CHAR(transaction_date::date, 'Mon') as month,
        EXTRACT(MONTH FROM transaction_date::date) as month_num,
        SUM(amount)::numeric as total
      FROM financial_transactions
      WHERE type = 'offering'
        AND EXTRACT(YEAR FROM transaction_date::date) = ${today.getFullYear()}
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    const weeklyAttendance = await db.execute(sql`
      SELECT 
        TO_CHAR(attendance_date::date, 'Dy') as day,
        COUNT(*)::int as count
      FROM attendance
      WHERE attendance_date::date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY day, attendance_date::date
      ORDER BY attendance_date::date
    `);

    const memberGrowth = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        EXTRACT(MONTH FROM created_at) as month_num,
        COUNT(*)::int as count
      FROM members
      WHERE EXTRACT(YEAR FROM created_at) = ${today.getFullYear()}
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    const ministryDistribution = await db.execute(sql`
      SELECT m.name, COUNT(mm.member_id)::int as count 
      FROM ministries m
      LEFT JOIN ministry_members mm ON m.id = mm.ministry_id
      WHERE m.is_active = true
      GROUP BY m.id, m.name
    `);

    const upcomingBirthdays = await db.execute(sql`
      SELECT id, first_name, last_name, birth_date, photo_url
      FROM members
      WHERE status = 'active'
        AND birth_date IS NOT NULL
        AND (
          (EXTRACT(MONTH FROM birth_date::date) = EXTRACT(MONTH FROM CURRENT_DATE) 
           AND EXTRACT(DAY FROM birth_date::date) >= EXTRACT(DAY FROM CURRENT_DATE))
          OR
          (EXTRACT(MONTH FROM birth_date::date) = EXTRACT(MONTH FROM CURRENT_DATE) + 1)
        )
      ORDER BY 
        EXTRACT(MONTH FROM birth_date::date),
        EXTRACT(DAY FROM birth_date::date)
      LIMIT 10
    `);

    // VALORES CALCULADOS
    const totalMembers = totalMembersResult?.count ?? 0;
    const prevTotalMembers = prevTotalMembersResult?.count ?? 0;

    const newMembers = newMembersResult?.count ?? 0;
    const prevNewMembers = prevNewMembersResult?.count ?? 0;

    const baptisms = baptismsResult?.count ?? 0;
    const prevBaptisms = prevBaptismsResult?.count ?? 0;

    const monthAttendance = monthAttendanceResult?.count ?? 0;
    const prevMonthAttendance = prevMonthAttendanceResult?.count ?? 0;

    const tithesThisMonth = Number(tithesResult[0]?.total ?? 0);
    const prevTithesThisMonth = Number(prevTithesResult[0]?.total ?? 0);

    const offeringsThisMonth = Number(offeringsResult[0]?.total ?? 0);
    const prevOfferingsThisMonth = Number(prevOfferingsResult[0]?.total ?? 0);

    const registeredVisitors = visitorsCountResult?.count ?? 0;
    const prevVisitors = prevVisitorsCountResult?.count ?? 0;

    return NextResponse.json({
      stats: {
        totalMembers,
        totalMembersTrend: calcTrend(totalMembers, prevTotalMembers),

        newMembersThisMonth: newMembers,
        newMembersTrend: calcTrend(newMembers, prevNewMembers),

        baptismsThisYear: baptisms,
        baptismsTrend: calcTrend(baptisms, prevBaptisms),

        monthAttendance,
        monthAttendanceTrend: calcTrend(monthAttendance, prevMonthAttendance),

        tithesThisMonth,
        tithesTrend: calcTrend(tithesThisMonth, prevTithesThisMonth),

        offeringsThisMonth,
        offeringsTrend: calcTrend(offeringsThisMonth, prevOfferingsThisMonth),

        activeMinistries: ministriesResult?.count ?? 0,
        activeMinistriesTrend: 0,

        pendingPrayers: prayerResult?.count ?? 0,
        pendingPrayersTrend: 0,

        registeredVisitors,
        registeredVisitorsTrend: calcTrend(registeredVisitors, prevVisitors),

        pendingFollowupCount: Number(pendingPastoralResult.rows[0]?.count || 0),
      },
      charts: {
        monthlyTithes: monthlyTithes.rows,
        monthlyOfferings: monthlyOfferings.rows,
        weeklyAttendance: weeklyAttendance.rows,
        memberGrowth: memberGrowth.rows,
        ministryDistribution: ministryDistribution.rows,
      },
      upcomingEvents,
      upcomingBirthdays: upcomingBirthdays.rows,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}