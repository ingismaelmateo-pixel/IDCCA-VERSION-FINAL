import { db } from "@/db";
import { documents } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc, like, sql, count, and } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener lista de documentos y estadísticas
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    let whereClause = undefined;

    if (search) {
      whereClause = sql`(${documents.title} ILIKE ${`%${search}%`} OR ${documents.description} ILIKE ${`%${search}%`})`;
    }
    if (category) {
      const catCondition = eq(documents.category, category);
      whereClause = whereClause ? and(whereClause, catCondition) : catCondition;
    }

    const docList = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.uploadedAt))
      .limit(limit);

    // KPIs
    const totalResult = await db.select({ count: count() }).from(documents);
    const recentResult = await db
      .select({ count: count() })
      .from(documents)
      .where(sql`${documents.uploadedAt} > NOW() - INTERVAL '30 days'`);

    return NextResponse.json({
      documents: docList,
      kpis: {
        total: totalResult[0]?.count || 0,
        recent: recentResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET Documents:", error);
    return NextResponse.json({ error: "Error al cargar documentos" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Subir un nuevo documento
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, fileUrl, fileType, fileSize, authorId } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "El título y la URL del archivo son obligatorios" }, { status: 400 });
    }

    const [newDoc] = await db.insert(documents).values({
      title,
      description: description || null,
      category: category || null,
      fileUrl,
      fileType: fileType || null,
      fileSize: fileSize ? parseInt(fileSize) : null,
      authorId: authorId ? parseInt(authorId) : null,
    }).returning();

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("Error POST Documents:", error);
    return NextResponse.json({ error: "Error al subir el documento" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un documento
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(documents).where(eq(documents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Documents:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}