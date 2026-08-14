import { db } from "@/db";
import { members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, or, desc, asc, sql, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";
    const offset = (page - 1) * limit;

    const conditions = [];

    // Filtro de búsqueda por texto
    if (search) {
      conditions.push(
        or(
          ilike(members.firstName, `%${search}%`),
          ilike(members.lastName, `%${search}%`),
          ilike(members.email, `%${search}%`),
          ilike(members.phone, `%${search}%`),
          ilike(members.cellPhone, `%${search}%`)
        )
      );
    }

    // Filtro por estado
    if (status && (status === "active" || status === "inactive" || status === "visitor")) {
      conditions.push(eq(members.status, status));
    }

    // Ordenamiento
    let orderClause;
    const direction = sortDir === "asc" ? asc : desc;
    switch (sortBy) {
      case "firstName":
        orderClause = direction(members.firstName);
        break;
      case "lastName":
        orderClause = direction(members.lastName);
        break;
      case "joinDate":
        orderClause = direction(members.joinDate);
        break;
      default:
        orderClause = direction(members.createdAt);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Ejecutamos la consulta de datos y el conteo filtrado en paralelo
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(members)
        .where(whereCondition)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(members)
        .where(whereCondition),
    ]);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Members GET error:", error);
    return NextResponse.json({ error: "Error al obtener los miembros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      gender,
      birthDate,
      maritalStatus,
      address,
      phone,
      cellPhone,
      email,
      documentId,
      joinDate,
      baptismDate,
      conversionDate,
      profession,
      company,
      facebook,
      instagram,
      whatsapp,
      emergencyContact,
      emergencyPhone,
      status,
      ministryId,
      leaderId,
      smallGroupId,
      observations,
      privateNotes,
      photoUrl,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "El nombre y apellido son obligatorios." },
        { status: 400 }
      );
    }

    const [newMember] = await db
      .insert(members)
      .values({
        firstName,
        lastName,
        gender: gender || null,
        birthDate: birthDate || null,
        maritalStatus: maritalStatus || null,
        address: address || null,
        phone: phone || null,
        cellPhone: cellPhone || null,
        email: email || null,
        documentId: documentId || null,
        joinDate: joinDate || null,
        baptismDate: baptismDate || null,
        conversionDate: conversionDate || null,
        profession: profession || null,
        company: company || null,
        facebook: facebook || null,
        instagram: instagram || null,
        whatsapp: whatsapp || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        status: status || "active",
        ministryId: ministryId ? parseInt(String(ministryId)) : null,
        leaderId: leaderId ? parseInt(String(leaderId)) : null,
        smallGroupId: smallGroupId ? parseInt(String(smallGroupId)) : null,
        observations: observations || null,
        privateNotes: privateNotes || null,
        photoUrl: photoUrl || null,
      })
      .returning();

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Members POST error:", error);
    return NextResponse.json({ error: "Error al crear el miembro" }, { status: 500 });
  }
}