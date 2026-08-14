import { db } from "@/db";
import { financialTransactions, members, ministries, transactionTypeEnum } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, between } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener transacciones financieras (con filtros por tipo, miembro y fecha)
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type"); // tithe, offering, donation, expense, transfer
    const memberId = searchParams.get("memberId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // 1. Arreglo de condiciones para Drizzle ORM
    const conditions = [];

    // Validar y filtrar por tipo de transacción (Enum)
    if (typeParam) {
      const foundEnum = transactionTypeEnum.enumValues.find((v) => v === typeParam);
      if (foundEnum) {
        conditions.push(eq(financialTransactions.type, foundEnum));
      }
    }

    // Filtrar por Miembro
    if (memberId && !isNaN(parseInt(memberId, 10))) {
      conditions.push(eq(financialTransactions.memberId, parseInt(memberId, 10)));
    }

    // Filtrar por rango de Fechas
    if (startDate && endDate) {
      conditions.push(between(financialTransactions.transactionDate, startDate, endDate));
    }

    // 2. Consulta a la base de datos
    const query = await db
      .select({
        id: financialTransactions.id,
        type: financialTransactions.type,
        amount: financialTransactions.amount,
        description: financialTransactions.description,
        memberId: financialTransactions.memberId,
        ministryId: financialTransactions.ministryId,
        eventId: financialTransactions.eventId,
        category: financialTransactions.category,
        subcategory: financialTransactions.subcategory,
        paymentMethod: financialTransactions.paymentMethod,
        receiptNumber: financialTransactions.receiptNumber,
        transactionDate: financialTransactions.transactionDate,
        notes: financialTransactions.notes,
        isVerified: financialTransactions.isVerified,
        createdAt: financialTransactions.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        ministryName: ministries.name,
      })
      .from(financialTransactions)
      .leftJoin(members, eq(financialTransactions.memberId, members.id))
      .leftJoin(ministries, eq(financialTransactions.ministryId, ministries.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(financialTransactions.transactionDate))
      .limit(isNaN(limit) ? 50 : limit);

    return NextResponse.json(query);
  } catch (error) {
    console.error("Error GET Finances:", error);
    return NextResponse.json({ error: "Error al cargar finanzas" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear una nueva transacción financiera
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      type, 
      amount, 
      description, 
      memberId, 
      ministryId, 
      eventId, 
      category, 
      subcategory, 
      paymentMethod, 
      receiptNumber, 
      transactionDate, 
      notes, 
      isVerified 
    } = body;

    // Validaciones básicas
    if (!type || !amount || !transactionDate) {
      return NextResponse.json({ error: "Tipo, Monto y Fecha son requeridos" }, { status: 400 });
    }

    // Validar que el tipo esté dentro de los valores permitidos del Enum
    const allowedTypes = transactionTypeEnum.enumValues;
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo de transacción inválido. Permitidos: ${allowedTypes.join(', ')}` }, 
        { status: 400 }
      );
    }

    const [newTransaction] = await db
      .insert(financialTransactions)
      .values({
        type: type as typeof transactionTypeEnum.enumValues[number],
        amount: amount.toString(),
        description: description || "",
        memberId: memberId && !isNaN(parseInt(memberId, 10)) ? parseInt(memberId, 10) : null,
        ministryId: ministryId && !isNaN(parseInt(ministryId, 10)) ? parseInt(ministryId, 10) : null,
        eventId: eventId && !isNaN(parseInt(eventId, 10)) ? parseInt(eventId, 10) : null,
        category: category || "",
        subcategory: subcategory || "",
        paymentMethod: paymentMethod || "Efectivo",
        receiptNumber: receiptNumber || "",
        transactionDate: transactionDate,
        notes: notes || "",
        isVerified: isVerified || false,
      })
      .returning();

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error POST Finances:", error);
    return NextResponse.json({ error: "Error al crear la transacción" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar una transacción por ID
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const id = idParam ? parseInt(idParam, 10) : 0;

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "ID válido es requerido" }, { status: 400 });
    }

    await db.delete(financialTransactions).where(eq(financialTransactions.id, id));

    return NextResponse.json({ success: true, message: "Transacción eliminada correctamente" });
  } catch (error) {
    console.error("Error DELETE Finances:", error);
    return NextResponse.json({ error: "Error al eliminar la transacción" }, { status: 500 });
  }
}