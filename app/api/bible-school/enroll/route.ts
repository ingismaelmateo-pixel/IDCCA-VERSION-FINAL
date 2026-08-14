import { NextResponse } from "next/server";
import { db } from "@/db"; // Reemplaza con la ruta de tu instancia de Drizzle
import { courseEnrollments, bibleCourses } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { courseId, memberIds } = await req.json();

    if (!courseId || !memberIds || !Array.isArray(memberIds)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Insertar matriculaciones masivas
    const enrollmentsToInsert = memberIds.map((studentId: number) => ({
      courseId,
      studentId,
      status: "active",
    }));

    await db.insert(courseEnrollments).values(enrollmentsToInsert);

    // Actualizar el contador de estudiantes en el curso
    await db
      .update(bibleCourses)
      .set({
        currentStudents: sql`${bibleCourses.currentStudents} + ${memberIds.length}`,
      })
      .where(eq(bibleCourses.id, courseId));

    return NextResponse.json({ success: true, message: "Estudiantes inscritos correctamente" });
  } catch (error) {
    console.error("Error al inscribir estudiantes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}