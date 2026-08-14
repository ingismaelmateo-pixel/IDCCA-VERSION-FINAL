import { db } from "@/db";
import { prayerRequests, members, prayerStatusEnum } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, like, count, desc, sql, isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause = undefined;
    
    // Construir filtros dinámicamente
    if (search) {
      const searchCondition = sql`(${prayerRequests.requesterName} ILIKE ${`%${search}%`} OR ${prayerRequests.request} ILIKE ${`%${search}%`})`;
      whereClause = searchCondition;
    }

    if (status) {
      const foundStatus = prayerStatusEnum.enumValues.find(v => v === status);
      if (foundStatus) {
        const statusCondition = eq(prayerRequests.status, foundStatus);
        whereClause = whereClause ? sql`${whereClause} AND ${statusCondition}` : statusCondition;
      }
    }

    // Obtener lista de peticiones con datos del miembro
    const prayers = await db
      .select({
        id: prayerRequests.id,
        memberId: prayerRequests.memberId,
        requesterName: prayerRequests.requesterName,
        request: prayerRequests.request,
        category: prayerRequests.category,
        status: prayerRequests.status,
        responsibleId: prayerRequests.responsibleId,
        response: prayerRequests.response,
        testimony: prayerRequests.testimony,
        isPrivate: prayerRequests.isPrivate,
        requestDate: prayerRequests.requestDate,
        answeredDate: prayerRequests.answeredDate,
        createdAt: prayerRequests.createdAt,
        updatedAt: prayerRequests.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberPhotoUrl: members.photoUrl,
      })
      .from(prayerRequests)
      .leftJoin(members, eq(prayerRequests.memberId, members.id))
      .where(whereClause)
      .orderBy(desc(prayerRequests.createdAt))
      .limit(limit);

    // --- CÁLCULO DE KPIs ---
    const totalResult = await db.select({ count: count() }).from(prayerRequests);
    const pendingResult = await db
      .select({ count: count() })
      .from(prayerRequests)
      .where(eq(prayerRequests.status, 'pending'));
    const answeredResult = await db
      .select({ count: count() })
      .from(prayerRequests)
      .where(eq(prayerRequests.status, 'answered'));

    return NextResponse.json({
      prayers,
      kpis: {
        total: totalResult[0]?.count || 0,
        pending: pendingResult[0]?.count || 0,
        answered: answeredResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET Prayers:", error);
    return NextResponse.json({ error: "Error al cargar peticiones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, requesterName, request, category, status, responsibleId, response, testimony, isPrivate, requestDate } = body;

    if (!request) {
      return NextResponse.json({ error: "La petición es requerida" }, { status: 400 });
    }

    // Si no se proporciona fecha, usar hoy
    const finalRequestDate = requestDate || new Date().toISOString().split('T')[0];

    const [newPrayer] = await db.insert(prayerRequests).values({
      memberId: memberId ? parseInt(memberId) : null,
      requesterName: requesterName || null,
      request,
      category: category || null,
      status: status || 'pending',
      responsibleId: responsibleId ? parseInt(responsibleId) : null,
      response: response || null,
      testimony: testimony || null,
      isPrivate: isPrivate !== undefined ? isPrivate : false,
      requestDate: finalRequestDate,
    }).returning();

    return NextResponse.json(newPrayer, { status: 201 });
  } catch (error) {
    console.error("Error POST Prayers:", error);
    return NextResponse.json({ error: "Error al crear la petición" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Si el estado cambia a 'answered', establecer la fecha de respuesta
    const updateData: any = {
      status: body.status,
      response: body.response,
      testimony: body.testimony,
      responsibleId: body.responsibleId ? parseInt(body.responsibleId) : null,
      isPrivate: body.isPrivate,
      category: body.category,
    };

    // Si se marca como respondida y no tenía fecha, establecerla
    if (body.status === 'answered' && !body.answeredDate) {
      updateData.answeredDate = new Date().toISOString().split('T')[0];
    } else if (body.answeredDate) {
      updateData.answeredDate = body.answeredDate;
    }

    const [updatedPrayer] = await db
      .update(prayerRequests)
      .set(updateData)
      .where(eq(prayerRequests.id, id))
      .returning();

    return NextResponse.json(updatedPrayer);
  } catch (error) {
    console.error("Error PUT Prayers:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Prayers:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}