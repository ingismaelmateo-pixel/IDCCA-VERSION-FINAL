import { db } from "@/db";
import { memberRelationships, members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";

// Definimos el tipo de dato que devolveremos para cada miembro relacionado
type MemberData = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  birthDate: string | null;
  maritalStatus: string | null;
  email: string | null;
  cellPhone: string | null;
  photoUrl: string | null;
  address: string | null;
  profession: string | null;
};

// ----------------------------------------------------------------------
// GET: Obtener y agrupar relaciones familiares de un miembro
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const memberIdParam = searchParams.get("memberId");

    if (!memberIdParam) {
      return NextResponse.json(
        { error: "Se requiere el ID del miembro" },
        { status: 400 }
      );
    }

    const memberId = parseInt(memberIdParam, 10);
    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: "El ID del miembro debe ser un número válido" },
        { status: 400 }
      );
    }

    // 1. Obtener todas las relaciones activas del miembro
    const relationships = await db
      .select({
        id: memberRelationships.id,
        memberId: memberRelationships.memberId,
        relatedMemberId: memberRelationships.relatedMemberId,
        relationshipType: memberRelationships.relationshipType,
        isActive: memberRelationships.isActive,
        createdAt: memberRelationships.createdAt,
      })
      .from(memberRelationships)
      .where(
        and(
          eq(memberRelationships.memberId, memberId),
          eq(memberRelationships.isActive, true)
        )
      );

    // Estructura base con tipado correcto
    const grouped: {
      spouse: MemberData[];
      parents: MemberData[];
      children: MemberData[];
      siblings: MemberData[];
    } = {
      spouse: [],
      parents: [],
      children: [],
      siblings: [],
    };

    // Si no hay relaciones, devolvemos la estructura vacía
    if (relationships.length === 0) {
      return NextResponse.json(grouped);
    }

    // 2. Filtrar IDs de los miembros relacionados para obtener solo los números válidos
    const relatedIds = relationships
      .map((r) => r.relatedMemberId)
      .filter((id): id is number => id !== null);

    // Si no hay IDs válidos después de filtrar, devolvemos vacío
    if (relatedIds.length === 0) {
      return NextResponse.json(grouped);
    }

    // 3. Obtener los datos de los miembros relacionados
    const relatedMembersData = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        gender: members.gender,
        birthDate: members.birthDate,
        maritalStatus: members.maritalStatus,
        email: members.email,
        cellPhone: members.cellPhone,
        photoUrl: members.photoUrl,
        address: members.address,
        profession: members.profession,
      })
      .from(members)
      .where(inArray(members.id, relatedIds));

    // Mapa para cruce rápido de datos
    const memberMap = new Map<number, MemberData>();
    relatedMembersData.forEach((m) => {
      memberMap.set(m.id, m);
    });

    // 4. Agrupar la información por tipo de relación
    grouped.spouse = relationships
      .filter((r) => r.relationshipType === "spouse" && r.relatedMemberId !== null)
      .map((r) => memberMap.get(r.relatedMemberId as number))
      .filter((member): member is MemberData => member !== undefined);
      
    grouped.parents = relationships
      .filter((r) => r.relationshipType === "parent" && r.relatedMemberId !== null)
      .map((r) => memberMap.get(r.relatedMemberId as number))
      .filter((member): member is MemberData => member !== undefined);
      
    grouped.children = relationships
      .filter((r) => r.relationshipType === "child" && r.relatedMemberId !== null)
      .map((r) => memberMap.get(r.relatedMemberId as number))
      .filter((member): member is MemberData => member !== undefined);
      
    grouped.siblings = relationships
      .filter((r) => r.relationshipType === "sibling" && r.relatedMemberId !== null)
      .map((r) => memberMap.get(r.relatedMemberId as number))
      .filter((member): member is MemberData => member !== undefined);

    return NextResponse.json(grouped);
  } catch (error: any) {
    console.error("Error al obtener relaciones:", error);
    return NextResponse.json(
      { error: "Error interno al obtener relaciones" },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// POST: Crear una nueva relación familiar
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, relatedMemberId, relationshipType } = body;

    if (!memberId || !relatedMemberId || !relationshipType) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (memberId, relatedMemberId, relationshipType)" },
        { status: 400 }
      );
    }

    // 🔥 CORRECCIÓN CRUCIAL: FORZAR A QUE SEAN NÚMEROS
    // Aunque el frontend envíe "1" (string), esto lo convierte a 1 (número)
    const parsedMemberId = Number(memberId);
    const parsedRelatedMemberId = Number(relatedMemberId);

    if (isNaN(parsedMemberId) || isNaN(parsedRelatedMemberId)) {
      return NextResponse.json(
        { error: "Los IDs deben ser números válidos" },
        { status: 400 }
      );
    }

    // Validación: No permitir autoreferencias
    if (parsedMemberId === parsedRelatedMemberId) {
      return NextResponse.json(
        { error: "Un miembro no puede asignarse una relación consigo mismo" },
        { status: 400 }
      );
    }

    // Verificar si la relación principal ya existe
    const existing = await db
      .select()
      .from(memberRelationships)
      .where(
        and(
          eq(memberRelationships.memberId, parsedMemberId),
          eq(memberRelationships.relatedMemberId, parsedRelatedMemberId),
          eq(memberRelationships.relationshipType, relationshipType)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Esta relación ya existe en la base de datos" },
        { status: 400 }
      );
    }

    // Insertar la relación principal
    const [newRelationship] = await db
      .insert(memberRelationships)
      .values({
        memberId: parsedMemberId,
        relatedMemberId: parsedRelatedMemberId,
        relationshipType,
        isActive: true,
      })
      .returning();

    // Crear relación recíproca para tipos simétricos ('spouse' y 'sibling')
    const symmetricalTypes = ["spouse", "sibling"];
    if (symmetricalTypes.includes(relationshipType)) {
      // Verificar que no exista la inversa primero
      const reciprocalExisting = await db
        .select()
        .from(memberRelationships)
        .where(
          and(
            eq(memberRelationships.memberId, parsedRelatedMemberId),
            eq(memberRelationships.relatedMemberId, parsedMemberId),
            eq(memberRelationships.relationshipType, relationshipType)
          )
        );

      // Si no existe, la creamos
      if (reciprocalExisting.length === 0) {
        await db.insert(memberRelationships).values({
          memberId: parsedRelatedMemberId,
          relatedMemberId: parsedMemberId,
          relationshipType,
          isActive: true,
        });
      }
    }

    return NextResponse.json(newRelationship, { status: 201 });
  } catch (error: any) {
    // Esto imprimirá el error real en tu terminal de VS Code
    console.error("❌ ERROR DETALLADO AL CREAR RELACIÓN:", error);
    return NextResponse.json(
      { error: `Error interno: ${error.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar una relación familiar
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, relatedMemberId, relationshipType } = body;

    if (!memberId || !relatedMemberId || !relationshipType) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const parsedMemberId = Number(memberId);
    const parsedRelatedMemberId = Number(relatedMemberId);

    if (isNaN(parsedMemberId) || isNaN(parsedRelatedMemberId)) {
      return NextResponse.json(
        { error: "Los IDs deben ser números válidos" },
        { status: 400 }
      );
    }

    // Eliminar la relación principal
    await db
      .delete(memberRelationships)
      .where(
        and(
          eq(memberRelationships.memberId, parsedMemberId),
          eq(memberRelationships.relatedMemberId, parsedRelatedMemberId),
          eq(memberRelationships.relationshipType, relationshipType)
        )
      );

    // Eliminar relación inversa si es simétrica
    const symmetricalTypes = ["spouse", "sibling"];
    if (symmetricalTypes.includes(relationshipType)) {
      await db
        .delete(memberRelationships)
        .where(
          and(
            eq(memberRelationships.memberId, parsedRelatedMemberId),
            eq(memberRelationships.relatedMemberId, parsedMemberId),
            eq(memberRelationships.relationshipType, relationshipType)
          )
        );
    }

    return NextResponse.json({ success: true, message: "Relación eliminada correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar relación:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar relación" },
      { status: 500 }
    );
  }
}