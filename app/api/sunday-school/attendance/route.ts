import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

// GET - Obtener asistencias
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");

    let query = sql`SELECT * FROM sunday_school_attendance WHERE 1=1`;

    if (date) {
      query = sql`${query} AND attendance_date = ${date}`;
    }

    if (studentId) {
      query = sql`${query} AND student_id = ${parseInt(studentId)}`;
    }

    query = sql`${query} ORDER BY attendance_date DESC`;

    const result = await db.execute(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error GET attendance:", error);
    return NextResponse.json(
      { error: "Error al obtener la asistencia" },
      { status: 500 }
    );
  }
}

// POST - Registrar asistencia
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentIds, attendanceDate, notes } = body;

    if (!studentIds || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un estudiante" },
        { status: 400 }
      );
    }

    const date = attendanceDate || new Date().toISOString().split("T")[0];

    // ✅ Eliminar asistencias existentes
    await db.execute(sql`
      DELETE FROM sunday_school_attendance
      WHERE attendance_date = ${date}
      AND student_id = ANY(${studentIds}::int[])
    `);

    // ✅ Insertar nuevas asistencias
    const results = [];
    for (const studentId of studentIds) {
      const result = await db.execute(sql`
        INSERT INTO sunday_school_attendance (student_id, attendance_date, is_present, notes)
        VALUES (${studentId}, ${date}, true, ${notes || null})
        RETURNING *
      `);
      results.push(result.rows[0]);
    }

    return NextResponse.json({
      success: true,
      message: `Asistencia registrada para ${results.length} estudiante(s)`,
      attendance: results
    });
  } catch (error) {
    console.error("Error POST attendance:", error);
    return NextResponse.json(
      { error: "Error al registrar la asistencia" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar asistencia
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM sunday_school_attendance WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: "Asistencia eliminada correctamente"
    });
  } catch (error) {
    console.error("Error DELETE attendance:", error);
    return NextResponse.json(
      { error: "Error al eliminar la asistencia" },
      { status: 500 }
    );
  }
}