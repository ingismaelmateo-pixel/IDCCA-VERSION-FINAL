import { NextResponse } from "next/server";
import { db } from "@/db"; // Ajusta según tu cliente Drizzle
import { tithes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET: Obtener lista de diezmos y KPIs
export async function GET() {
  try {
    const list = await db.select().from(tithes).orderBy(desc(tithes.createdAt)).limit(100);
    
    // Calcular KPIs
    const totalAmount = list.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTotal = list
      .filter((t) => t.date === todayStr)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    return NextResponse.json({
      tithes: list,
      kpis: {
        totalAmount,
        todayTotal,
        totalRecords: list.length,
      },
    });
  } catch (error: any) {
    console.error("Error en GET /api/diezmos:", error);
    return NextResponse.json({ error: "Error al obtener diezmos" }, { status: 500 });
  }
}

// POST: Registrar nuevo diezmo
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { memberId, memberName, amount, paymentMethod, date, notes } = body;

    if (!memberName || !amount || !date) {
      return NextResponse.json(
        { error: "Nombre, monto y fecha son obligatorios" },
        { status: 400 }
      );
    }

    const newTithe = await db.insert(tithes).values({
      memberId: memberId || null,
      memberName,
      amount: String(amount),
      paymentMethod: paymentMethod || "Efectivo",
      date,
      notes: notes || null,
    }).returning();

    return NextResponse.json(newTithe[0], { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/diezmos:", error);
    return NextResponse.json({ error: "Error al registrar diezmo" }, { status: 500 });
  }
}

// DELETE: Eliminar un diezmo por ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(tithes).where(eq(tithes.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en DELETE /api/diezmos:", error);
    return NextResponse.json({ error: "Error al eliminar diezmo" }, { status: 500 });
  }
}