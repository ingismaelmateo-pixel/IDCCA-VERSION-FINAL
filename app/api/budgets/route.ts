import { db } from "@/db";
import { budgets, ministries } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc, between, sum, sql } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener presupuestos
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ministryId = searchParams.get("ministryId");
    const year = searchParams.get("year");
    
    let whereClause = undefined;
    if (ministryId) {
      whereClause = eq(budgets.ministryId, parseInt(ministryId));
    }
    if (year) {
      const yearCond = eq(budgets.year, parseInt(year));
      whereClause = whereClause ? and(whereClause, yearCond) : yearCond;
    }

    // Hacemos un LEFT JOIN con ministries para obtener el nombre del ministerio
    const query = await db
      .select({
        id: budgets.id,
        name: budgets.name,
        ministryId: budgets.ministryId,
        eventId: budgets.eventId,
        totalAmount: budgets.totalAmount,
        usedAmount: budgets.usedAmount,
        year: budgets.year,
        month: budgets.month,
        description: budgets.description,
        isActive: budgets.isActive,
        createdAt: budgets.createdAt,
        ministryName: ministries.name,
      })
      .from(budgets)
      .leftJoin(ministries, eq(budgets.ministryId, ministries.id))
      .where(whereClause)
      .orderBy(desc(budgets.year), desc(budgets.createdAt));

    return NextResponse.json(query);
  } catch (error) {
    console.error("Error GET Budgets:", error);
    return NextResponse.json({ error: "Error al cargar presupuestos" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear un nuevo presupuesto
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ministryId, eventId, totalAmount, usedAmount, year, month, description, isActive } = body;

    if (!name || !totalAmount || !year) {
      return NextResponse.json({ error: "Nombre, Monto Total y Año son requeridos" }, { status: 400 });
    }

    const [newBudget] = await db.insert(budgets).values({
      name,
      ministryId: ministryId ? parseInt(ministryId) : null,
      eventId: eventId ? parseInt(eventId) : null,
      totalAmount: totalAmount.toString(),
      usedAmount: usedAmount ? usedAmount.toString() : "0",
      year: parseInt(year),
      month: month ? parseInt(month) : null,
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return NextResponse.json(newBudget, { status: 201 });
  } catch (error) {
    console.error("Error POST Budgets:", error);
    return NextResponse.json({ error: "Error al crear el presupuesto" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT: Actualizar un presupuesto
// ----------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const [updatedBudget] = await db
      .update(budgets)
      .set({
        name: body.name,
        ministryId: body.ministryId ? parseInt(body.ministryId) : null,
        eventId: body.eventId ? parseInt(body.eventId) : null,
        totalAmount: body.totalAmount.toString(),
        usedAmount: body.usedAmount ? body.usedAmount.toString() : "0",
        year: parseInt(body.year),
        month: body.month ? parseInt(body.month) : null,
        description: body.description || "",
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .where(eq(budgets.id, id))
      .returning();

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("Error PUT Budgets:", error);
    return NextResponse.json({ error: "Error al actualizar el presupuesto" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un presupuesto
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(budgets).where(eq(budgets.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Budgets:", error);
    return NextResponse.json({ error: "Error al eliminar el presupuesto" }, { status: 500 });
  }
}