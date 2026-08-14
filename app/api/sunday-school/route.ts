import { db } from "@/db";
import { sundaySchoolStudents, sundaySchoolAttendance } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, like, sql, count } from "drizzle-orm";

// GET: Obtener lista de niños (con KPIs)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = undefined;
    if (search) {
      whereClause = sql`(${sundaySchoolStudents.firstName} ILIKE ${`%${search}%`} OR ${sundaySchoolStudents.lastName} ILIKE ${`%${search}%`})`;
    }

    const students = await db
      .select()
      .from(sundaySchoolStudents)
      .where(whereClause)
      .orderBy(desc(sundaySchoolStudents.createdAt))
      .limit(limit);

    // KPIs para el tablero
    const totalStudentsResult = await db.select({ count: count() }).from(sundaySchoolStudents);
    const activeStudentsResult = await db.select({ count: count() }).from(sundaySchoolStudents).where(eq(sundaySchoolStudents.status, 'active'));
    const todayStr = new Date().toISOString().split("T")[0];
    const attendanceTodayResult = await db.select({ count: count() }).from(sundaySchoolAttendance).where(eq(sundaySchoolAttendance.attendanceDate, todayStr));

    return NextResponse.json({
      students,
      kpis: {
        total: totalStudentsResult[0]?.count || 0,
        active: activeStudentsResult[0]?.count || 0,
        attendanceToday: attendanceTodayResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET Sunday School:", error);
    return NextResponse.json({ error: "Error al cargar estudiantes" }, { status: 500 });
  }
}

// POST: Crear un nuevo niño o registrar asistencia
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    // Acción: REGISTRAR NUEVO NIÑO
    if (action === 'registerStudent') {
      const { firstName, lastName, birthDate, parentId, phone, address, grade, allergies, emergencyContact, emergencyPhone } = data;
      
      if (!firstName || !lastName || !birthDate) {
        return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
      }

      const [newStudent] = await db.insert(sundaySchoolStudents).values({
        firstName, 
        lastName, 
        birthDate,
        parentId: parentId ? parseInt(parentId) : null,
        phone, 
        address, 
        grade, 
        allergies, 
        emergencyContact, 
        emergencyPhone,
        status: 'active'
      }).returning();

      return NextResponse.json(newStudent, { status: 201 });
    }

    // ✅ Acción: REGISTRAR ASISTENCIA (MEJORADO - Evita duplicados)
    if (action === 'registerAttendance') {
      const { studentIds, attendanceDate } = data;
      
      if (!studentIds || studentIds.length === 0) {
        return NextResponse.json({ error: "Selecciona al menos un niño" }, { status: 400 });
      }

      const date = attendanceDate || new Date().toISOString().split("T")[0];

      // ✅ Verificar si ya existe asistencia para cada estudiante en esta fecha
      const results = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          // Verificar si ya existe un registro para este estudiante en esta fecha
          const existing = await db
            .select()
            .from(sundaySchoolAttendance)
            .where(
              and(
                eq(sundaySchoolAttendance.studentId, studentId),
                eq(sundaySchoolAttendance.attendanceDate, date)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // ✅ Si ya existe, actualizar en lugar de insertar
            await db
              .update(sundaySchoolAttendance)
              .set({ isPresent: true, updatedAt: new Date() })
              .where(
                and(
                  eq(sundaySchoolAttendance.studentId, studentId),
                  eq(sundaySchoolAttendance.attendanceDate, date)
                )
              );
            results.push({ studentId, status: 'updated' });
          } else {
            // ✅ Si no existe, insertar nuevo registro
            const [newAttendance] = await db
              .insert(sundaySchoolAttendance)
              .values({
                studentId,
                attendanceDate: date,
                isPresent: true,
              })
              .returning();
            results.push({ studentId, status: 'created', record: newAttendance });
          }
        } catch (error) {
          console.error(`Error procesando asistencia para estudiante ${studentId}:`, error);
          errors.push({ studentId, error: String(error) });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Asistencia procesada para ${results.length} niño(s)`,
        results,
        errors: errors.length > 0 ? errors : undefined
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error POST Sunday School:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

// DELETE: Eliminar un niño
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // ✅ También eliminar los registros de asistencia asociados (ON DELETE CASCADE en la DB)
    await db.delete(sundaySchoolStudents).where(eq(sundaySchoolStudents.id, id));
    
    return NextResponse.json({ 
      success: true,
      message: "Niño eliminado correctamente"
    });
  } catch (error) {
    console.error("Error DELETE Sunday School:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}