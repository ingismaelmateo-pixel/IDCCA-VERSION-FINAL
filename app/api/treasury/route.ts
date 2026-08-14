import { db } from "@/db";
import { cashRegister, financialTransactions } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc, sum, count, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Buscar si hay una caja ABIERTA actualmente
    const [openRegister] = await db
      .select()
      .from(cashRegister)
      .where(eq(cashRegister.status, "open"))
      .orderBy(desc(cashRegister.openingDate))
      .limit(1);

    const register = openRegister || null;

    // Rango de fechas ISO para Drizzle
    const filterStartDateStr = register 
      ? new Date(register.openingDate).toISOString() 
      : startOfDay.toISOString();
    const filterEndDateStr = endOfDay.toISOString();

    // 2. Totales de Ingresos y Gastos
    const [incomeResult] = await db
      .select({
        total: sum(financialTransactions.amount),
        count: count(financialTransactions.id),
      })
      .from(financialTransactions)
      .where(
        and(
          gte(financialTransactions.transactionDate, filterStartDateStr),
          lte(financialTransactions.transactionDate, filterEndDateStr),
          inArray(financialTransactions.type, ["tithe", "offering", "donation"])
        )
      );

    const [expenseResult] = await db
      .select({
        total: sum(financialTransactions.amount),
        count: count(financialTransactions.id),
      })
      .from(financialTransactions)
      .where(
        and(
          gte(financialTransactions.transactionDate, filterStartDateStr),
          lte(financialTransactions.transactionDate, filterEndDateStr),
          eq(financialTransactions.type, "expense")
        )
      );

    const dayIncome = parseFloat(incomeResult?.total || "0");
    const incomeCount = Number(incomeResult?.count || 0);

    const dayExpense = parseFloat(expenseResult?.total || "0");
    const expenseCount = Number(expenseResult?.count || 0);

    const openingBalance = parseFloat(register?.openingBalance || "0");
    const estimatedClosingBalance = openingBalance + dayIncome - dayExpense;
    const netFlow = dayIncome - dayExpense;

    // 3. Transacciones recientes
    const recentTransactions = await db
      .select()
      .from(financialTransactions)
      .where(
        and(
          gte(financialTransactions.transactionDate, filterStartDateStr),
          lte(financialTransactions.transactionDate, filterEndDateStr)
        )
      )
      .orderBy(desc(financialTransactions.transactionDate))
      .limit(15);

    // 4. KPIs
    const kpis = {
      openingBalance,
      dayIncome,
      incomeCount,
      dayExpense,
      expenseCount,
      netFlow,
      estimatedClosingBalance,
      avgIncomeTransaction: incomeCount > 0 ? dayIncome / incomeCount : 0,
      expenseRatio: dayIncome > 0 ? ((dayExpense / dayIncome) * 100).toFixed(1) : "0.0",
    };

    return NextResponse.json({
      register,
      kpis,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error GET Treasury:", error);
    return NextResponse.json({ error: "Error al obtener datos de tesorería" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { openingBalance, cashierId } = body;

    if (openingBalance === undefined || openingBalance === null || isNaN(Number(openingBalance))) {
      return NextResponse.json({ error: "Saldo inicial válido es requerido" }, { status: 400 });
    }

    const [existingOpen] = await db
      .select()
      .from(cashRegister)
      .where(eq(cashRegister.status, "open"))
      .limit(1);

    if (existingOpen) {
      return NextResponse.json({ error: "Ya existe una caja abierta en el sistema" }, { status: 400 });
    }

    const [newRegister] = await db
      .insert(cashRegister)
      .values({
        openingBalance: Number(openingBalance).toString(),
        cashierId: cashierId ? Number(cashierId) : null,
        openingDate: new Date(),
        status: "open",
        totalIncome: "0",
        totalExpenses: "0",
      })
      .returning();

    return NextResponse.json(newRegister, { status: 201 });
  } catch (error) {
    console.error("Error POST Treasury:", error);
    return NextResponse.json({ error: "Error al abrir la caja" }, { status: 500 });
  }
}

// ✅ PATCH - Cerrar caja (ARQUEO) - MODIFICADO
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      closingBalance, 
      notes, 
      dayIncome, 
      dayExpense,
      theoreticalBalance,  // ✅ Nuevo: saldo teórico calculado
      variance             // ✅ Nuevo: diferencia
    } = body;

    if (!id || closingBalance === undefined || isNaN(Number(closingBalance))) {
      return NextResponse.json({ error: "ID y Saldo de Cierre válido son requeridos" }, { status: 400 });
    }

    // ✅ Verificar que la caja existe y está abierta
    const [existingRegister] = await db
      .select()
      .from(cashRegister)
      .where(eq(cashRegister.id, Number(id)))
      .limit(1);

    if (!existingRegister) {
      return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    }

    if (existingRegister.status === 'closed') {
      return NextResponse.json({ error: "Esta caja ya está cerrada" }, { status: 400 });
    }

    // ✅ Usar valores del body o los existentes
    const finalIncome = dayIncome !== undefined ? Number(dayIncome) : parseFloat(existingRegister.totalIncome || "0");
    const finalExpenses = dayExpense !== undefined ? Number(dayExpense) : parseFloat(existingRegister.totalExpenses || "0");
    const closingBalanceNum = Number(closingBalance);
    const theoretical = theoreticalBalance !== undefined ? Number(theoreticalBalance) : (Number(existingRegister.openingBalance) + finalIncome - finalExpenses);
    const diff = variance !== undefined ? Number(variance) : (closingBalanceNum - theoretical);

    // ✅ Actualizar la caja
    const [closedRegister] = await db
      .update(cashRegister)
      .set({
        closingBalance: closingBalanceNum.toString(),
        closingDate: new Date(),
        totalIncome: finalIncome.toString(),
        totalExpenses: finalExpenses.toString(),
        notes: notes || existingRegister.notes || "",
        status: "closed",
      })
      .where(eq(cashRegister.id, Number(id)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Caja cerrada correctamente",
      register: closedRegister,
      arqueo: {
        theoreticalBalance: theoretical,
        closingBalance: closingBalanceNum,
        variance: diff,
        status: Math.abs(diff) < 0.01 ? 'balanced' : diff > 0 ? 'surplus' : 'shortage',
      }
    });
  } catch (error) {
    console.error("Error PATCH Treasury:", error);
    return NextResponse.json({ error: "Error al cerrar la caja" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID de caja requerido" }, { status: 400 });
    }

    const [deletedRegister] = await db
      .delete(cashRegister)
      .where(eq(cashRegister.id, Number(id)))
      .returning();

    if (!deletedRegister) {
      return NextResponse.json({ error: "No se encontró la caja para eliminar" }, { status: 404 });
    }

    return NextResponse.json({ message: "Turno de caja eliminado con éxito", deletedRegister });
  } catch (error) {
    console.error("Error DELETE Treasury:", error);
    return NextResponse.json({ error: "Error interno al eliminar la caja" }, { status: 500 });
  }
}