import { db } from "@/db";
import { bibleCourses } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const [course] = await db
      .select()
      .from(bibleCourses)
      .where(eq(bibleCourses.id, id));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();

    const dataToUpdate: any = {
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
      dataToUpdate.teacherId = parseInt(body.teacherId);
    }

    const [updatedCourse] = await db
      .update(bibleCourses)
      .set(dataToUpdate)
      .where(eq(bibleCourses.id, id))
      .returning();

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const [deletedCourse] = await db
      .delete(bibleCourses)
      .where(eq(bibleCourses.id, id))
      .returning();

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}