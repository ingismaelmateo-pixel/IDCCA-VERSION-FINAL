import { db } from "@/db";
import { bibleCourses } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc, and, like, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(bibleCourses.name, `%${search}%`),
          like(bibleCourses.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(bibleCourses.category, category));
    }

    if (level) {
      conditions.push(eq(bibleCourses.level, level));
    }

    if (status) {
      conditions.push(eq(bibleCourses.status, status));
    }

    const data = await db
      .select({
        id: bibleCourses.id,
        name: bibleCourses.name,
        description: bibleCourses.description,
        category: bibleCourses.category,
        level: bibleCourses.level,
        teacherId: bibleCourses.teacherId,
        scheduleDay: bibleCourses.scheduleDay,
        scheduleTime: bibleCourses.scheduleTime,
        duration: bibleCourses.duration,
        maxStudents: bibleCourses.maxStudents,
        currentStudents: bibleCourses.currentStudents,
        startDate: bibleCourses.startDate,
        endDate: bibleCourses.endDate,
        status: bibleCourses.status,
        requirements: bibleCourses.requirements,
        syllabus: bibleCourses.syllabus,
        photoUrl: bibleCourses.photoUrl,
        isActive: bibleCourses.isActive,
        createdAt: bibleCourses.createdAt,
        updatedAt: bibleCourses.updatedAt,
        teacherName: sql<string>`(
          SELECT CONCAT(first_name, ' ', last_name) FROM members 
          WHERE id = ${bibleCourses.teacherId}
        )`,
      })
      .from(bibleCourses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bibleCourses.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bibleCourses)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ data, total, totalPages, page, limit });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const dataToInsert: any = {
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      level: body.level || null,
      scheduleDay: body.scheduleDay || null,
      scheduleTime: body.scheduleTime || null,
      duration: body.duration || null,
      maxStudents: body.maxStudents ? parseInt(body.maxStudents) : 30,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      status: body.status || 'active',
      requirements: body.requirements || null,
      syllabus: body.syllabus || null,
      photoUrl: body.photoUrl || null,
      isActive: body.isActive ?? true,
    };

    if (body.teacherId) {
      dataToInsert.teacherId = parseInt(body.teacherId);
    }

    const [newCourse] = await db.insert(bibleCourses).values(dataToInsert).returning();
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}