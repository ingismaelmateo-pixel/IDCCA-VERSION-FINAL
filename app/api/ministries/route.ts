import { db } from "@/db";
import { ministries, members, ministryMembers } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc, and, like, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(ministries.name, `%${search}%`),
          sql`EXISTS (SELECT 1 FROM members WHERE members.id = ${ministries.leaderId} AND CONCAT(members.first_name, ' ', members.last_name) LIKE ${`%${search}%`})`
        )
      );
    }

    if (type) {
      conditions.push(eq(ministries.type, type));
    }

    if (status) {
      conditions.push(eq(ministries.status, status));
    }

    const data = await db
      .select({
        id: ministries.id,
        name: ministries.name,
        description: ministries.description,
        leaderId: ministries.leaderId,
        subLeaderId: ministries.subLeaderId,
        type: ministries.type,
        status: ministries.status,
        meetingDay: ministries.meetingDay,
        meetingTime: ministries.meetingTime,
        meetingLocation: ministries.meetingLocation,
        meetingFrequency: ministries.meetingFrequency,
        objectives: ministries.objectives,
        vision: ministries.vision,
        goals: ministries.goals,
        budget: ministries.budget,
        isActive: ministries.isActive,
        email: ministries.email,
        phone: ministries.phone,
        photoUrl: ministries.photoUrl,
        observations: ministries.observations,
        createdAt: ministries.createdAt,
        updatedAt: ministries.updatedAt,
        memberCount: sql<number>`CAST(COALESCE((
          SELECT COUNT(*) FROM ${ministryMembers} 
          WHERE ${ministryMembers.ministryId} = ${ministries.id} AND ${ministryMembers.isActive} = true
        ), 0) AS INTEGER)`,
        leaderName: sql<string>`(
          SELECT CONCAT(${members.firstName}, ' ', ${members.lastName}) FROM ${members} 
          WHERE ${members.id} = ${ministries.leaderId}
        )`,
        subLeaderName: sql<string>`(
          SELECT CONCAT(${members.firstName}, ' ', ${members.lastName}) FROM ${members} 
          WHERE ${members.id} = ${ministries.subLeaderId}
        )`,
      })
      .from(ministries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ministries.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ministries)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Estadísticas para KPI
    const [totalMinistries, totalMembers, activeMinistries] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(ministries),
      db.select({ count: sql<number>`COUNT(*)` }).from(members),
      db.select({ count: sql<number>`COUNT(*)` }).from(ministries).where(eq(ministries.isActive, true)),
    ]);

    const totalMinistriesCount = Number(totalMinistries[0]?.count) || 0;
    const totalMembersCount = Number(totalMembers[0]?.count) || 0;
    const activeMinistriesCount = Number(activeMinistries[0]?.count) || 0;
    
    const avgMembersPerMinistry = totalMinistriesCount > 0 
      ? Math.round(totalMembersCount / totalMinistriesCount) 
      : 0;

    return NextResponse.json({
      data,
      total,
      totalPages,
      page,
      limit,
      stats: {
        totalMinistries: totalMinistriesCount,
        totalMembers: totalMembersCount,
        activeMinistries: activeMinistriesCount,
        avgMembersPerMinistry
      }
    });
  } catch (error) {
    console.error('Error fetching ministries:', error);
    return NextResponse.json({ error: "Failed to fetch ministries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const dataToInsert: any = {
      name: body.name,
      description: body.description || null,
      type: body.type || null,
      status: body.status || 'active',
      meetingDay: body.meetingDay || null,
      meetingTime: body.meetingTime || null,
      meetingLocation: body.meetingLocation || null,
      meetingFrequency: body.meetingFrequency || 'weekly',
      objectives: body.objectives || null,
      vision: body.vision || null,
      goals: body.goals || null,
      budget: body.budget || null,
      isActive: body.isActive ?? true,
      email: body.email || null,
      phone: body.phone || null,
      photoUrl: body.photoUrl || null,
      observations: body.observations || null,
    };

    if (body.leaderId && !isNaN(Number(body.leaderId))) {
      dataToInsert.leaderId = Number(body.leaderId);
    }
    if (body.subLeaderId && !isNaN(Number(body.subLeaderId))) {
      dataToInsert.subLeaderId = Number(body.subLeaderId);
    }

    const [newMinistry] = await db.insert(ministries).values(dataToInsert).returning();
    return NextResponse.json(newMinistry, { status: 201 });
  } catch (error) {
    console.error('Error creating ministry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el ministerio" },
      { status: 500 }
    );
  }
}