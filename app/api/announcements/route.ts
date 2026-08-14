import { db } from "@/db";
import { announcements, members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, like, count, desc, sql, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const isPublished = searchParams.get("isPublished");
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = undefined;
    
    if (search) {
      const searchCondition = sql`(${announcements.title} ILIKE ${`%${search}%`} OR ${announcements.content} ILIKE ${`%${search}%`})`;
      whereClause = searchCondition;
    }
    if (isPublished !== null && isPublished !== undefined && isPublished !== "") {
      const publishedCond = eq(announcements.isPublished, isPublished === "true");
      whereClause = whereClause ? and(whereClause, publishedCond) : publishedCond;
    }

    const allAnnouncements = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        authorId: announcements.authorId,
        targetAudience: announcements.targetAudience,
        publishDate: announcements.publishDate,
        expiryDate: announcements.expiryDate,
        isPinned: announcements.isPinned,
        isPublished: announcements.isPublished,
        imageUrl: announcements.imageUrl,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        authorFirstName: members.firstName,
        authorLastName: members.lastName,
      })
      .from(announcements)
      .leftJoin(members, eq(announcements.authorId, members.id))
      .where(whereClause)
      .orderBy(desc(announcements.isPinned), desc(announcements.publishDate))
      .limit(limit);

    // --- KPIs Rápidos ---
    const totalResult = await db.select({ count: count() }).from(announcements);
    const publishedResult = await db
      .select({ count: count() })
      .from(announcements)
      .where(eq(announcements.isPublished, true));

    return NextResponse.json({
      announcements: allAnnouncements,
      kpis: {
        total: totalResult[0]?.count || 0,
        published: publishedResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET Announcements:", error);
    return NextResponse.json({ error: "Error al cargar anuncios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, authorId, targetAudience, publishDate, expiryDate, isPinned, isPublished, imageUrl } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Título y Contenido son requeridos" }, { status: 400 });
    }

    const [newAnnouncement] = await db.insert(announcements).values({
      title,
      content,
      authorId: authorId ? parseInt(authorId) : null,
      targetAudience: targetAudience || "all",
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isPinned: isPinned !== undefined ? isPinned : false,
      isPublished: isPublished !== undefined ? isPublished : false,
      imageUrl: imageUrl || null,
    }).returning();

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error("Error POST Announcements:", error);
    return NextResponse.json({ error: "Error al crear el anuncio" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({
        title: body.title,
        content: body.content,
        targetAudience: body.targetAudience,
        publishDate: body.publishDate ? new Date(body.publishDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        isPinned: body.isPinned,
        isPublished: body.isPublished,
        imageUrl: body.imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error("Error PUT Announcements:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.delete(announcements).where(eq(announcements.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Announcements:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}