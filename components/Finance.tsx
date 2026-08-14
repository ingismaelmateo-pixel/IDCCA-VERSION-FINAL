"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign, Plus, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownRight, Filter, Download, Check, X, Receipt
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { formatCurrency, formatDate, generateReceiptNumber } from "@/lib/utils";

interface Transaction {
  id: number;
  type: string;
  amount: string;
  description: string;
  category: string;
  subcategory: string;
  paymentMethod: string;
  receiptNumber: string;
  transactionDate: string;
  notes: string;
  isVerified: boolean;
}

interface Summary {
  type: string;
  total: string;
  count: number;
}

const typeColors: Record<string, string> = {
  tithe: "#1e3a6e",
  offering: "#c9a84c",
  donation: "#10b981",
  expense: "#ef4444",
  transfer: "#8b5cf6",
};

const typeLabels: Record<string, string> = {
  tithe: "Diezmo",
  offering: "Ofrenda",
  donation: "Donación",
  expense: "Gasto",
  transfer: "Transferencia",
};

const typeBadges: Record<string, string> = {
  tithe: "badge-info",
  offering: "badge-gold",
  donation: "badge-success",
  expense: "badge-danger",
  transfer: "badge-warning",
};

const incomeData = [
  { name: "Ene", tithes: 45000, offerings: 12000 },
  { name: "Feb", tithes: 52000, offerings: 15000 },
  { name: "Mar", tithes: 48000, offerings: 11000 },
  { name: "Abr", tithes: 61000, offerings: 18000 },
  { name: "May", tithes: 55000, offerings: 14000 },
  { name: "Jun", tithes: 67000, offerings: 20000 },
];

export default function Finance({ section }: { section: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [typeFilter, setTypeFilter] = useState(
    section === "finance-tithes" ? "tithe" :
    section === "finance-offerings" ? "offering" :
    section === "finance-expenses" ? "expense" :
    section === "finance-donations" ? "donation" : ""
  );

  const [form, setForm] = useState({
    type: typeFilter || "tithe",
    amount: "",
    description: "",
    category: "",
    paymentMethod: "cash",
    receiptNumber: generateReceiptNumber(),
    transactionDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(typeFilter && { type: typeFilter }) });
      const res = await fetch(`/api/finance?${params}`);
      const data = await res.json();
      setTransactions(data.data || []);
      setSummary(data.summary || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalIncome = summary
    .filter((s) => ["tithe", "offering", "donation"].includes(s.type))
    .reduce((acc, s) => acc + Number(s.total), 0);

  const totalExpenses = summary
    .filter((s) => s.type === "expense")
    .reduce((acc, s) => acc + Number(s.total), 0);

  const balance = totalIncome - totalExpenses;

  const pieData = summary.map((s) => ({
    name: typeLabels[s.type] || s.type,
    value: Math.abs(Number(s.total)),
    color: typeColors[s.type] || "#999",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm({ ...form, amount: "", description: "", receiptNumber: generateReceiptNumber() });
          fetchData();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle =
    section === "finance-tithes" ? "Diezmos" :
    section === "finance-offerings" ? "Ofrendas" :
    section === "finance-expenses" ? "Gastos" :
    section === "finance-donations" ? "Donaciones" :
    section === "finance-reports" ? "Reportes Financieros" :
    "Gestión Financiera";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">{sectionTitle}</h2>
          <p className="text-gray-400 text-sm mt-0.5">Control integral de finanzas eclesiásticas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex items-center gap-2 text-sm">
            <Download size={15} /> Exportar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nueva Transacción
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Ingresos</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome || 847000)}</p>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600 font-semibold">
                <ArrowUpRight size={12} /> <span>+12.4% este mes</span>
              </div>
            </div>
            <div className="icon-wrap icon-wrap-success w-12 h-12">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Gastos</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalExpenses || 312000)}</p>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-semibold">
                <ArrowDownRight size={12} /> <span>+5.2% este mes</span>
              </div>
            </div>
            <div className="icon-wrap icon-wrap-danger w-12 h-12">
              <TrendingDown size={22} />
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Balance General</p>
              <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-blue-900" : "text-red-500"}`}>
                {formatCurrency(balance || 535000)}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">Saldo disponible</p>
            </div>
            <div className="icon-wrap icon-wrap-primary w-12 h-12">
              <DollarSign size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card-premium p-6">
          <h3 className="section-title mb-1">Ingresos Mensuales</h3>
          <p className="section-subtitle mb-4">Diezmos y ofrendas comparados</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), ""]}
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid #dde3f0", fontSize: "0.8125rem" }}
              />
              <Bar dataKey="tithes" fill="#1e3a6e" radius={[4, 4, 0, 0]} name="Diezmos" />
              <Bar dataKey="offerings" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Ofrendas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-premium p-6">
          <h3 className="section-title mb-1">Distribución</h3>
          <p className="section-subtitle mb-4">Por tipo de transacción</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <DollarSign size={40} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">Sin datos disponibles</p>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieData[index].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), ""]}
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid #dde3f0", fontSize: "0.8125rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-gray-500">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter & Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {["", "tithe", "offering", "donation", "expense", "transfer"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === t
                    ? "bg-blue-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t === "" ? "Todos" : typeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Recibo</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Método</th>
                <th>Fecha</th>
                <th className="text-right">Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Receipt size={48} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">No hay transacciones registradas</p>
                    <p className="text-gray-300 text-sm mt-1">Registra tu primera transacción financiera</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className="text-xs font-mono text-gray-500">{tx.receiptNumber}</span>
                    </td>
                    <td>
                      <span className={`badge ${typeBadges[tx.type]}`}>
                        {typeLabels[tx.type]}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{tx.description || tx.category || "—"}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500 capitalize">{tx.paymentMethod || "—"}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{formatDate(tx.transactionDate)}</span>
                    </td>
                    <td className="text-right">
                      <span className={`font-bold text-sm ${
                        tx.type === "expense" ? "text-red-600" : "text-emerald-600"
                      }`}>
                        {tx.type === "expense" ? "-" : "+"}{formatCurrency(Number(tx.amount))}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${tx.isVerified ? "badge-success" : "badge-warning"}`}>
                        {tx.isVerified ? "Verificado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">Nueva Transacción</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Transacción registrada!</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo *</label>
                  <select className="input-field" required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="tithe">Diezmo</option>
                    <option value="offering">Ofrenda</option>
                    <option value="donation">Donación</option>
                    <option value="expense">Gasto</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Monto *</label>
                  <input type="number" step="0.01" min="0" className="input-field" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Método de Pago</label>
                  <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="cash">Efectivo</option>
                    <option value="check">Cheque</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                  <input type="date" className="input-field" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                  <input className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Misiones, Construcción" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">No. Recibo</label>
                  <input className="input-field font-mono text-xs" value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción de la transacción" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
                <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
