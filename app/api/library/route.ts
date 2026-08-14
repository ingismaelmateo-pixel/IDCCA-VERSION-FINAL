import { db } from "@/db";
import { libraryBooks, bookLoans } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, like, sql, count } from "drizzle-orm";

// ----------------------------------------------------------------------
// GET: Obtener libros y estadísticas
// ----------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause: any = undefined;

    if (search) {
      whereClause = sql`(${libraryBooks.title} ILIKE ${`%${search}%`} OR ${libraryBooks.author} ILIKE ${`%${search}%`})`;
    }
    if (category) {
      const catCondition = eq(libraryBooks.category, category);
      whereClause = whereClause ? and(whereClause, catCondition) : catCondition;
    }

    const books = await db
      .select()
      .from(libraryBooks)
      .where(whereClause)
      .orderBy(desc(libraryBooks.createdAt))
      .limit(limit);

    // KPIs para el tablero
    const totalBooksResult = await db.select({ count: count() }).from(libraryBooks);
    const availableBooksResult = await db
      .select({ count: count() })
      .from(libraryBooks)
      .where(sql`"available_count" > 0`); // 🔥 CORREGIDO: Usamos el nombre literal de la columna en la BD
    
    const activeLoansResult = await db
      .select({ count: count() })
      .from(bookLoans)
      .where(eq(bookLoans.status, 'active'));

    return NextResponse.json({
      books,
      kpis: {
        total: totalBooksResult[0]?.count || 0,
        available: availableBooksResult[0]?.count || 0,
        activeLoans: activeLoansResult[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Error GET Library:", error);
    return NextResponse.json({ error: "Error al cargar la biblioteca" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Crear libro o registrar préstamo
// ----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    // ACCIÓN: AGREGAR NUEVO LIBRO
    if (action === 'addBook') {
      const { title, author, isbn, category, description, quantity, publishedYear, coverUrl } = data;
      
      if (!title) {
        return NextResponse.json({ error: "El título del libro es obligatorio" }, { status: 400 });
      }

      const [newBook] = await db.insert(libraryBooks).values({
        title,
        author: author || null,
        isbn: isbn || null,
        category: category || null,
        description: description || null,
        quantity: parseInt(quantity) || 1,
        availableCount: parseInt(quantity) || 1,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        coverUrl: coverUrl || null,
        isActive: true,
      }).returning();

      return NextResponse.json(newBook, { status: 201 });
    }

    // ACCIÓN: PRESTAR LIBRO
    if (action === 'loanBook') {
      const { bookId, memberId, dueDate } = data;

      if (!bookId || !memberId) {
        return NextResponse.json({ error: "Faltan datos para el préstamo" }, { status: 400 });
      }

      // Verificar si el libro está disponible
      const [book] = await db.select().from(libraryBooks).where(eq(libraryBooks.id, parseInt(bookId)));
      if (!book || (book.availableCount || 0) <= 0) {
        return NextResponse.json({ error: "Este libro no está disponible para préstamo" }, { status: 400 });
      }

      // Reducir el contador de disponibles en 1
      await db.update(libraryBooks)
        .set({ availableCount: sql`${libraryBooks.availableCount} - 1` })
        .where(eq(libraryBooks.id, parseInt(bookId)));

      // Crear el registro de préstamo
      const [loan] = await db.insert(bookLoans).values({
        bookId: parseInt(bookId),
        memberId: parseInt(memberId),
        loanDate: new Date().toISOString().split("T")[0],
        dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: 'active',
        notes: data.notes || "",
      }).returning();

      return NextResponse.json(loan, { status: 201 });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error POST Library:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Eliminar un libro
// ----------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(libraryBooks).where(eq(libraryBooks.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE Library:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}