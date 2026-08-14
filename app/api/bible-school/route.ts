// src/app/api/bible-school/route.ts
import { db } from "@/db";
import { bibleCourses } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const totalCourses = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bibleCourses);

    const activeCourses = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bibleCourses)
      .where(sql`status = 'active'`);

    const totalStudents = await db
      .select({ sum: sql<number>`sum(current_students)::int` })
      .from(bibleCourses);

    return NextResponse.json({
      total: totalCourses[0]?.count || 0,
      active: activeCourses[0]?.count || 0,
      students: totalStudents[0]?.sum || 0,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}