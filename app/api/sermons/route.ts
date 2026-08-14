import { db } from "@/db";
import { sermons, members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { desc, ilike, or, and, eq, sql } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener lista de sermones con filtro y búsqueda
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const series = searchParams.get("series") || "";
    const sort = searchParams.get("sort") || "recent";

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(sermons.title, `%${search}%`),
          ilike(sermons.series, `%${search}%`),
          ilike(sermons.tags, `%${search}%`),
          ilike(sermons.bibleReference, `%${search}%`)
        )
      );
    }
    if (series) {
      conditions.push(eq(sermons.series, series));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderBy = sort === "views" ? desc(sermons.viewCount) : desc(sermons.sermonDate);

    const data = await db
      .select({
        id: sermons.id,
        title: sermons.title,
        preacherId: sermons.preacherId,
        preacherName: sql<string>`concat(${members.firstName}, ' ', ${members.lastName})`,
        series: sermons.series,
        sermonDate: sermons.sermonDate,
        audioUrl: sermons.audioUrl,
        videoUrl: sermons.videoUrl,
        pdfUrl: sermons.pdfUrl,
        presentationUrl: sermons.presentationUrl,
        bibleReference: sermons.bibleReference,
        tags: sermons.tags,
        description: sermons.description,
        viewCount: sermons.viewCount,
        createdAt: sermons.createdAt,
      })
      .from(sermons)
      .leftJoin(members, eq(sermons.preacherId, members.id))
      .where(whereClause)
      .orderBy(orderBy);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error GET sermons:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear un nuevo sermón
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [s] = await db
      .insert(sermons)
      .values({
        title: body.title,
        preacherId: body.preacherId ? parseInt(body.preacherId, 10) : null,
        series: body.series || null,
        sermonDate: body.sermonDate,
        audioUrl: body.audioUrl || null,
        videoUrl: body.videoUrl || null,
        pdfUrl: body.pdfUrl || null,
        presentationUrl: body.presentationUrl || null,
        bibleReference: body.bibleReference || null,
        tags: body.tags || null,
        description: body.description || null,
      })
      .returning();

    return NextResponse.json(s, { status: 201 });
  } catch (error) {
    console.error("Error POST sermons:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT: Actualizar un sermón (o incrementar vistas)
// ----------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  context?: { params: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    let idParam = searchParams.get("id");
    let body: any = {};

    try {
      body = await req.json();
    } catch {
      // Si no trae body JSON, continuamos
    }

    // 1. Si no vino en ?id=1, buscar si venía en el Body
    if (!idParam && body.id) {
      idParam = String(body.id);
    }

    // 2. Si tampoco, verificar si vino en la ruta dinámica ([id])
    if (!idParam && context?.params) {
      const params = await context.params;
      if (params?.id) idParam = params.id;
    }

    if (!idParam) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Si la petición es para incrementar vistas
    if (body.incrementView) {
      const [updated] = await db
        .update(sermons)
        .set({ viewCount: sql`${sermons.viewCount} + 1` })
        .where(eq(sermons.id, id))
        .returning();
      return NextResponse.json(updated);
    }

    // Actualización normal de datos
    const [updated] = await db
      .update(sermons)
      .set({
        title: body.title,
        preacherId: body.preacherId ? parseInt(body.preacherId, 10) : null,
        series: body.series || null,
        sermonDate: body.sermonDate,
        audioUrl: body.audioUrl || null,
        videoUrl: body.videoUrl || null,
        pdfUrl: body.pdfUrl || null,
        presentationUrl: body.presentationUrl || null,
        bibleReference: body.bibleReference || null,
        tags: body.tags || null,
        description: body.description || null,
      })
      .where(eq(sermons.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error PUT sermons:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un sermón (Soporta múltiples fuentes de ID)
// ----------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  context?: { params: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    let idStr = searchParams.get("id");

    // 1. Si no vino en ?id=1, verificar los parámetros dinámicos de ruta ([id])
    if (!idStr && context?.params) {
      const params = await context.params;
      if (params?.id) idStr = params.id;
    }

    // 2. Si tampoco vino ahí, extraerlo del último segmento de la URL (/api/sermons/1)
    if (!idStr) {
      const pathSegments = req.nextUrl.pathname.split("/").filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && !isNaN(Number(lastSegment))) {
        idStr = lastSegment;
      }
    }

    // 3. Si tampoco, intentar leerlo si vino en un Body JSON ({ "id": 1 })
    if (!idStr) {
      try {
        const body = await req.json();
        if (body && body.id) idStr = String(body.id);
      } catch {
        // Ignorar si no hay JSON
      }
    }

    if (!idStr) {
      return NextResponse.json({ error: "ID del sermón es requerido" }, { status: 400 });
    }

    // Transformar de forma segura a Integer para PostgreSQL
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido, debe ser un número entero" }, { status: 400 });
    }

    // Ejecutar eliminación en PostgreSQL
    await db.delete(sermons).where(eq(sermons.id, id));

    return NextResponse.json({ success: true, message: "Sermón eliminado correctamente" });
  } catch (error) {
    console.error("Error DELETE sermon:", error);
    return NextResponse.json({ error: "Error al eliminar el sermón" }, { status: 500 });
  }
}