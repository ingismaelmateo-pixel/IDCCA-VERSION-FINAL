import { NextResponse } from "next/server";
import { db } from "@/db";
import { classAttendance, courseEnrollments, attendance } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface AttendanceItem {
  enrollmentId: number;
  studentId: number;
  present: boolean;
  observations?: string;
}

export async function POST(req: Request) {
  try {
    const { courseId, classDate, records } = await req.json();
    // records = [{ enrollmentId: 1, studentId: 10, present: true, observations: "" }, ...]

    if (!courseId || !classDate || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // 1. Guardar en la tabla de asistencia del curso (classAttendance)
    const classRecords = records.map((r: AttendanceItem) => ({
      enrollmentId: r.enrollmentId,
      classDate: classDate,
      present: r.present,
      observations: r.observations || "",
    }));

    await db.insert(classAttendance).values(classRecords);

    // 2. SINCRONIZAR: Registrar en la tabla general de Asistencia (attendance)
    const generalAttendanceRecords = records.map((r: AttendanceItem) => ({
      memberId: r.studentId,
      personType: "member",
      attendanceDate: classDate,
      serviceType: "Escuela Bíblica",
      status: r.present ? "present" : "absent",
      isPresent: r.present,
      notes: r.observations || `Asistencia a Curso Bíblico ID: ${courseId}`,
    }));

    await db.insert(attendance).values(generalAttendanceRecords);

    // 3. Incrementar el contador acumulado de clases y asistencias en las matrículas
    for (const r of records) {
      await db
        .update(courseEnrollments)
        .set({
          totalClasses: sql`${courseEnrollments.totalClasses} + 1`,
          attendance: r.present
            ? sql`${courseEnrollments.attendance} + 1`
            : courseEnrollments.attendance,
        })
        .where(eq(courseEnrollments.id, r.enrollmentId));
    }

    return NextResponse.json({ success: true, message: "Asistencia registrada y sincronizada correctamente" });
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}