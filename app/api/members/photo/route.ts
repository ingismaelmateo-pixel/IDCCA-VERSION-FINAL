import { db } from "@/db";
import { members } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, photoUrl } = body;

    if (!memberId || !photoUrl) {
      return NextResponse.json(
        { error: "memberId y photoUrl son obligatorios" },
        { status: 400 }
      );
    }

    // photoUrl llega como base64 (ej: "data:image/png;base64,AAAA...")
    // Lo convertimos a un archivo binario para poder subirlo.
    const matches = String(photoUrl).match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Formato de imagen inválido" },
        { status: 400 }
      );
    }

    const mimeType = matches[1]; // ej: "image/png"
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const extension = mimeType.split("/")[1] || "jpg";

    // Subimos la imagen a Vercel Blob (almacenamiento externo, no a la base de datos)
    const blob = await put(
      `members/${memberId}-${Date.now()}.${extension}`,
      buffer,
      {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
      }
    );

    // Guardamos solo el LINK (blob.url) en la base de datos, no la imagen completa
    await db
      .update(members)
      .set({ photoUrl: blob.url })
      .where(eq(members.id, parseInt(String(memberId), 10)));

    return NextResponse.json({ success: true, photoUrl: blob.url });
  } catch (error) {
    console.error("Error al actualizar la foto:", error);
    return NextResponse.json(
      { error: "Error interno al guardar la foto" },
      { status: 500 }
    );
  }
}