import { db } from "@/db";
import { sermons } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

// ----------------------------------------------------------------------
// PUT /api/sermons/[id]
// ----------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 👈 params es Promise en Next 15+
) {
  try {
    const resolvedParams = await params; // 👈 Hacemos await de los parámetros
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // Caso especial: solo incrementar vistas (al reproducir)
    if (body.incrementView) {
      const [s] = await db
        .update(sermons)
        .set({ viewCount: sql`${sermons.viewCount} + 1` })
        .where(eq(sermons.id, id))
        .returning();

      return NextResponse.json(s);
    }

    // Actualización normal de datos
    const [s] = await db
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
        updatedAt: new Date(),
      })
      .where(eq(sermons.id, id))
      .returning();

    return NextResponse.json(s);
  } catch (error) {
    console.error("Error PUT sermon:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE /api/sermons/[id]
// ----------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 👈 params es Promise en Next 15+
) {
  try {
    const resolvedParams = await params; // 👈 Hacemos await de los parámetros
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await db.delete(sermons).where(eq(sermons.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE sermon:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}