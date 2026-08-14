import { NextResponse } from "next/server";
import { db } from "@/db";
import { courseEnrollments, members } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "ID de curso inválido" }, { status: 400 });
    }

    const enrolledStudents = await db
      .select({
        enrollmentId: courseEnrollments.id,
        studentId: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
      })
      .from(courseEnrollments)
      .innerJoin(members, eq(courseEnrollments.studentId, members.id))
      .where(eq(courseEnrollments.courseId, courseId));

    return NextResponse.json(enrolledStudents);
  } catch (error) {
    console.error("Error al obtener estudiantes inscritos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}