import { db } from "@/db";
import { inventoryItems, itemCategoryEnum } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, ilike, sum, count, sql } from "drizzle-orm";

// Auxiliares para sanitización de tipos
const parseNumber = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "") return null;
  const parsed = Number(val);
  return isNaN(parsed) ? null : parsed;
};

const parseDate = (val: unknown): Date | null => {
  if (!val || typeof val !== "string") return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
};

// ----------------------------------------------------------------------
// GET: Obtener ítems del inventario (con filtros y KPIs)
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const condition = searchParams.get("condition") || "";
    const limit = parseNumber(searchParams.get("limit")) || 50;

    // Construir WHERE dinámicamente
    const conditions = [];

    if (search) conditions.push(ilike(inventoryItems.name, `%${search}%`));
    if (category) {
      const found = itemCategoryEnum.enumValues.find((v) => v === category);
      if (found) conditions.push(eq(inventoryItems.category, found));
    }
    if (condition) conditions.push(eq(inventoryItems.condition, condition));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Consulta principal (traer items)
    const items = await db
      .select()
      .from(inventoryItems)
      .where(whereClause)
      .orderBy(desc(inventoryItems.createdAt))
      .limit(limit);

    // --- CÁLCULO DE KPIs ---
    // 1. Valor total considerando la cantidad (Precio * Cantidad)
    const totalValueResult = await db
      .select({
        total: sum(sql`${inventoryItems.purchasePrice} * ${inventoryItems.quantity}`),
      })
      .from(inventoryItems);

    // 2. Conteo total de ítems
    const totalItemsResult = await db
      .select({ count: count() })
      .from(inventoryItems);

    // 3. Conteo por categoría
    const categoryCounts = await db
      .select({
        category: inventoryItems.category,
        count: count(inventoryItems.id),
      })
      .from(inventoryItems)
      .groupBy(inventoryItems.category);

    return NextResponse.json({
      items,
      kpis: {
        totalValue: parseFloat(totalValueResult[0]?.total || "0"),
        totalItems: totalItemsResult[0]?.count || 0,
        categoryCounts,
      },
    });
  } catch (error) {
    console.error("Error GET Inventory:", error);
    return NextResponse.json({ error: "Error al cargar inventario" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear un nuevo ítem en el inventario
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, category, description, serialNumber, brand, model, 
      quantity, location, responsibleId, purchaseDate, purchasePrice, 
      condition, qrCodeUrl, notes, isActive 
    } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Nombre y Categoría son requeridos" }, { status: 400 });
    }

    const parsedQty = parseNumber(quantity);
    const parsedPrice = parseNumber(purchasePrice);

    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        name,
        category,
        description: description || null,
        serialNumber: serialNumber || null,
        brand: brand || null,
        model: model || null,
        quantity: parsedQty !== null ? parsedQty : 1,
        location: location || null,
        responsibleId: parseNumber(responsibleId),
        purchaseDate: parseDate(purchaseDate),
        purchasePrice: parsedPrice !== null ? parsedPrice.toString() : null,
        condition: condition || "good",
        qrCodeUrl: qrCodeUrl || null,
        notes: notes || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error POST Inventory:", error);
    return NextResponse.json({ error: "Error al crear el ítem" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT: Actualizar un ítem del inventario
// ----------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    const body = await req.json();
    
    // Admite ID por URL o dentro del body
    const id = parseNumber(idFromQuery || body.id);

    if (!id) return NextResponse.json({ error: "ID de ítem requerido" }, { status: 400 });

    const parsedQty = parseNumber(body.quantity);
    const parsedPrice = parseNumber(body.purchasePrice);

    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        name: body.name,
        category: body.category,
        description: body.description || null,
        serialNumber: body.serialNumber || null,
        brand: body.brand || null,
        model: body.model || null,
        quantity: parsedQty !== null ? parsedQty : undefined,
        location: body.location || null,
        responsibleId: parseNumber(body.responsibleId),
        purchaseDate: parseDate(body.purchaseDate),
        purchasePrice: parsedPrice !== null ? parsedPrice.toString() : null,
        condition: body.condition,
        qrCodeUrl: body.qrCodeUrl || null,
        notes: body.notes || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error PUT Inventory:", error);
    return NextResponse.json({ error: "Error al actualizar el ítem" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un ítem del inventario
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseNumber(searchParams.get("id"));

    if (!id) return NextResponse.json({ error: "ID válido requerido" }, { status: 400 });

    const [deletedItem] = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .returning();

    if (!deletedItem) {
      return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedItem });
  } catch (error) {
    console.error("Error DELETE Inventory:", error);
    return NextResponse.json({ error: "Error al eliminar el ítem" }, { status: 500 });
  }
}