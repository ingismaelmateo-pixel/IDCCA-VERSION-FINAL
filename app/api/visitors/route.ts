import { db } from "@/db";
import { visitors } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { desc, ilike, or, and, sql, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(visitors.firstName, `%${search}%`),
          ilike(visitors.lastName, `%${search}%`),
          ilike(visitors.email, `%${search}%`)
        )
      );
    }
    if (status) {
      conditions.push(eq(visitors.status, status));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(visitors)
      .where(whereClause)
      .orderBy(desc(visitors.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visitors)
      .where(whereClause);

    return NextResponse.json({
      data,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      page,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [v] = await db.insert(visitors).values({
      photoUrl: body.photoUrl || null,
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender || null,
      birthDate: body.birthDate || null,
      address: body.address,
      phone: body.phone,
      cellPhone: body.cellPhone,
      email: body.email,
      documentId: body.documentId,
      firstVisitDate: body.firstVisitDate || null,
      lastVisitDate: body.lastVisitDate || null,
      invitedBy: body.invitedBy ? parseInt(body.invitedBy) : null,
      origin: body.origin,
      interests: body.interests,
      decision: body.decision,
      converted: body.converted ?? false,
      conversionDate: body.conversionDate || null,
      baptismPending: body.baptismPending ?? false,
      baptismDate: body.baptismDate || null,
      followedBy: body.followedBy,
      followUpNotes: body.followUpNotes,
      observations: body.observations,
      privateNotes: body.privateNotes,
      status: body.status || "new",
    }).returning();
    return NextResponse.json(v, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
