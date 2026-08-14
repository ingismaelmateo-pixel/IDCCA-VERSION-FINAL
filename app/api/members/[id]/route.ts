import { db } from "@/db";
import { members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET: Obtener un miembro por su ID
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, numericId));

    if (!member) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("GET Member Error:", error);
    return NextResponse.json({ error: "Error al obtener el miembro" }, { status: 500 });
  }
}

// PUT: Actualizar un miembro existente
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    // Omitimos id y createdAt para evitar sobreescrituras indebidas
    const {
      id: _,
      createdAt: __,
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

    const [updatedMember] = await db
      .update(members)
      .set({
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
        ministryId: ministryId ? parseInt(String(ministryId), 10) : null,
        leaderId: leaderId ? parseInt(String(leaderId), 10) : null,
        smallGroupId: smallGroupId ? parseInt(String(smallGroupId), 10) : null,
        observations: observations || null,
        privateNotes: privateNotes || null,
        photoUrl: photoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(members.id, numericId))
      .returning();

    if (!updatedMember) {
      return NextResponse.json({ error: "Miembro no encontrado para actualizar" }, { status: 404 });
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("PUT Member Error:", error);
    return NextResponse.json({ error: "Error al actualizar el miembro" }, { status: 500 });
  }
}

// DELETE: Eliminar un miembro por ID
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [deletedMember] = await db
      .delete(members)
      .where(eq(members.id, numericId))
      .returning();

    if (!deletedMember) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: deletedMember.id });
  } catch (error) {
    console.error("DELETE Member Error:", error);
    return NextResponse.json({ error: "Error al eliminar el miembro" }, { status: 500 });
  }
}