import { db } from "@/db";
import { events, eventTypeEnum } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { desc, gte, eq, and, ilike, or, sql } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener eventos (con filtros de búsqueda, categoría y próximos)
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const eventType = searchParams.get("eventType") || "";
    const upcoming = searchParams.get("upcoming") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Construimos la condición WHERE dinámicamente
    let whereClause = undefined;

    if (upcoming) {
      // Si es upcoming, solo mostramos los que están por venir
      whereClause = gte(events.startDate, new Date());
    }

    if (search || eventType) {
      const conditions = [];
      if (search) {
        conditions.push(ilike(events.title, `%${search}%`));
      }
      if (eventType) {
        // Convertimos el string a un valor del enum de Postgres
        const enumValue = eventTypeEnum.enumValues.find(v => v === eventType);
        if (enumValue) {
          conditions.push(eq(events.eventType, enumValue));
        }
      }
      // Combinamos la condición de "upcoming" con las de búsqueda
      if (whereClause) {
        whereClause = and(whereClause, or(...conditions));
      } else {
        whereClause = or(...conditions);
      }
    }

    const data = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(desc(events.startDate))
      .limit(limit);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error GET Events:", error);
    return NextResponse.json({ error: "Error al cargar eventos" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear un nuevo evento
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar fecha de inicio obligatoria
    if (!body.startDate) {
      return NextResponse.json({ error: "La fecha de inicio es requerida" }, { status: 400 });
    }

    const [newEvent] = await db.insert(events).values({
      title: body.title,
      description: body.description,
      eventType: body.eventType || "service",
      bannerUrl: body.bannerUrl,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      location: body.location,
      capacity: body.capacity ? parseInt(body.capacity) : null,
      ministryId: body.ministryId ? parseInt(body.ministryId) : null,
      organizerId: body.organizerId ? parseInt(body.organizerId) : null,
      hasQrCode: body.hasQrCode ?? false,
      qrCodeUrl: body.qrCodeUrl,
      isPublic: body.isPublic ?? true,
      status: body.status || "upcoming",
    }).returning();

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error POST Event:", error);
    return NextResponse.json({ error: "Error al crear el evento" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT: Actualizar un evento existente
// ----------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID del evento requerido" }, { status: 400 });
    }

    const [updatedEvent] = await db
      .update(events)
      .set({
        title: body.title,
        description: body.description,
        eventType: body.eventType,
        bannerUrl: body.bannerUrl,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        location: body.location,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        ministryId: body.ministryId ? parseInt(body.ministryId) : null,
        organizerId: body.organizerId ? parseInt(body.organizerId) : null,
        hasQrCode: body.hasQrCode,
        qrCodeUrl: body.qrCodeUrl,
        isPublic: body.isPublic,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error PUT Event:", error);
    return NextResponse.json({ error: "Error al actualizar el evento" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un evento
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID del evento requerido" }, { status: 400 });
    }

    await db.delete(events).where(eq(events.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Event:", error);
    return NextResponse.json({ error: "Error al eliminar el evento" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PATCH: Incrementar el contador de registrados (Registrarme ahora)
// ----------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const action = searchParams.get("action"); // 'register' para sumar 1

    if (!id) {
      return NextResponse.json({ error: "ID del evento requerido" }, { status: 400 });
    }

    if (action === "register") {
      // Incrementamos registeredCount en 1 usando SQL raw para evitar condiciones de carrera
      const [updatedEvent] = await db
        .update(events)
        .set({
          registeredCount: sql`${events.registeredCount} + 1`,
        })
        .where(eq(events.id, id))
        .returning();

      return NextResponse.json(updatedEvent);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error PATCH Event:", error);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}