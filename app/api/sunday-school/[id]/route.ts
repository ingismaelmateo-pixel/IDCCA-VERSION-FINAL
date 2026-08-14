import { db } from "@/db";
import { sundaySchoolStudents } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// GET - Obtener un niño específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [student] = await db
      .select()
      .from(sundaySchoolStudents)
      .where(eq(sundaySchoolStudents.id, studentId));

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error GET student:", error);
    return NextResponse.json(
      { error: "Error al obtener el estudiante" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un niño
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    const [updated] = await db
      .update(sundaySchoolStudents)
      .set({
        ...body,
        updatedAt: new Date(),
        parentId: body.parentId ? parseInt(body.parentId) : null,
      })
      .where(eq(sundaySchoolStudents.id, studentId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error PUT student:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estudiante" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un niño (usando el ID de la URL)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await db
      .delete(sundaySchoolStudents)
      .where(eq(sundaySchoolStudents.id, studentId));

    return NextResponse.json({
      success: true,
      message: "Estudiante eliminado correctamente"
    });
  } catch (error) {
    console.error("Error DELETE student:", error);
    return NextResponse.json(
      { error: "Error al eliminar el estudiante" },
      { status: 500 }
    );
  }
}