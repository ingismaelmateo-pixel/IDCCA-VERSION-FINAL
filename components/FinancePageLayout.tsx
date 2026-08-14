"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, 
  Plus, Trash2, BarChart2, RefreshCw, Banknote,
  Receipt, Percent, LineChart, Crown
} from "lucide-react";
import { formatDate, formatDateShort } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

// Interfaces
interface Transaction {
  id: number;
  type: 'tithe' | 'offering' | 'donation' | 'expense' | 'transfer';
  amount: string;
  description: string | null;
  memberId: number | null;
  transactionDate: string;
  paymentMethod: string | null;
  notes: string | null;
  memberFirstName?: string;
  memberLastName?: string;
  ministryName?: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: any; bgColor: string; gradient: string }> = {
  tithe: { label: "Diezmos", color: "text-green-600", icon: TrendingUp, bgColor: "bg-green-100", gradient: "from-green-500 to-emerald-500" },
  offering: { label: "Ofrendas", color: "text-blue-600", icon: PiggyBank, bgColor: "bg-blue-100", gradient: "from-blue-500 to-cyan-500" },
  donation: { label: "Donaciones", color: "text-purple-600", icon: Receipt, bgColor: "bg-purple-100", gradient: "from-purple-500 to-pink-500" },
  expense: { label: "Gastos", color: "text-red-600", icon: TrendingDown, bgColor: "bg-red-100", gradient: "from-red-500 to-orange-500" },
  transfer: { label: "Transferencias", color: "text-orange-600", icon: Banknote, bgColor: "bg-orange-100", gradient: "from-orange-500 to-amber-500" },
};

export default function FinancePageLayout({ type, title }: { type: string, title: string }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: type,
    amount: "",
    description: "",
    memberId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Efectivo",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/finances?type=${type}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const data = await res.json();
      setTransactions(data || []);
    } catch (e) {
      console.error("Error fetching finances:", e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Sincronizar el tipo cuando cambia el prop 'type'
  useEffect(() => {
    setForm(f => ({ ...f, type }));
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ ...form, amount: "", description: "", notes: "" });
        fetchData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  // ============================================================
  // HANDLE ELIMINAR CON MODAL
  // ============================================================
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/finances?id=${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchData();
      } else {
        alert("Error al eliminar el registro");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ============================================================
  // KPIs Y GRÁFICOS MEJORADOS
  // ============================================================
  const totalAmount = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);
  const count = transactions.length;
  const average = count > 0 ? totalAmount / count : 0;
  const config = typeConfig[type] || typeConfig.tithe;
  const Icon = config.icon;

  // Calcular el mejor día (día de la semana con mayor ingreso/gasto)
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayTotals = Array(7).fill(0);
  transactions.forEach(t => {
    const dayIndex = new Date(t.transactionDate).getDay();
    if (!isNaN(dayIndex)) {
      dayTotals[dayIndex] += parseFloat(t.amount || "0");
    }
  });
  const maxDayIndex = dayTotals.indexOf(Math.max(...dayTotals));

  // Datos para el gráfico (Últimos 7 días)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayTotal = transactions
      .filter(t => t.transactionDate === dateStr)
      .reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);
    last7Days.push({ date: dateStr, amount: dayTotal });
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={24} className={config.color} />
            {title}
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Visualiza y gestiona los {title.toLowerCase()}
          </p>
        </div>
        <button 
          onClick={() => {
            setForm(f => ({ ...f, type }));
            setShowModal(true);
          }} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nuevo Movimiento
        </button>
      </div>

      {/* KPIs PROFESIONALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
              <h4 className={`text-3xl font-bold mt-1 ${config.color}`}>${totalAmount.toLocaleString()}</h4>
            </div>
            <div className={`p-3 rounded-xl ${config.bgColor} ${config.color}`}>
              <Icon size={22} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cantidad</p>
              <h4 className="text-3xl font-bold text-gray-800 mt-1">{count}</h4>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <BarChart2 size={22} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Promedio</p>
              <h4 className="text-3xl font-bold text-purple-600 mt-1">${average.toLocaleString()}</h4>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Percent size={22} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mejor Día</p>
              <h4 className="text-3xl font-bold text-orange-600 mt-1">
                {maxDayIndex >= 0 && dayTotals[maxDayIndex] > 0 ? dayNames[maxDayIndex] : '—'}
              </h4>
            </div>
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <Crown size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO SEMANAL */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <LineChart size={16} className={config.color} />
            Tendencia Semanal
          </h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            Últimos 7 días
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#9ca3af' }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => formatDateShort(val)}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#9ca3af' }} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Monto']}
                labelFormatter={(label) => {
                  const dateStr = typeof label === 'number' ? new Date(label).toISOString().split('T')[0] : String(label);
                  return `Fecha: ${dateStr ? formatDate(dateStr) : 'Desconocida'}`;
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                {last7Days.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.amount > 0 ? `url(#colorGradient)` : '#e5e7eb'} 
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color === 'text-green-600' ? '#22c55e' : config.color === 'text-blue-600' ? '#3b82f6' : config.color === 'text-purple-600' ? '#a855f7' : '#ef4444'} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={config.color === 'text-green-600' ? '#22c55e' : config.color === 'text-blue-600' ? '#3b82f6' : config.color === 'text-purple-600' ? '#a855f7' : '#ef4444'} stopOpacity={0.2}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LISTADO DE MOVIMIENTOS */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Receipt size={16} /> Registros Recientes
          </h3>
          <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center gap-1 py-1 px-3">
            <RefreshCw size={12} /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Monto</th>
                <th>Miembro</th>
                <th>Fecha</th>
                <th>Método de Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Wallet size={32} className="mx-auto mb-2 text-gray-200" />
                    No hay registros aún.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                    <td className={`font-bold ${config.color}`}>
                      ${parseFloat(t.amount).toLocaleString()}
                    </td>
                    <td className="text-sm text-gray-600">
                      {t.memberFirstName ? `${t.memberFirstName} ${t.memberLastName}` : (t.description || "—")}
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(t.transactionDate)}</td>
                    <td className="text-sm text-gray-500">{t.paymentMethod || "—"}</td>
                    <td>
                      <button 
                        onClick={() => setDeleteTarget(t.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NUEVA TRANSACCIÓN */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          {/* 🔥 SE AGREGÓ e.stopPropagation() PARA EVITAR QUE SE CIERRE AL CLICKEAR DENTRO */}
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Nuevo Movimiento</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Tipo</label>
                    <select 
                      className="input-field" 
                      value={form.type} 
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="tithe">Diezmo</option>
                      <option value="offering">Ofrenda</option>
                      <option value="donation">Donación</option>
                      <option value="expense">Gasto</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Monto ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="input-field" 
                      required 
                      value={form.amount} 
                      onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">Descripción</label>
                  <input 
                    className="input-field" 
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Fecha</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={form.transactionDate} 
                      onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Método de Pago</label>
                    <select 
                      className="input-field" 
                      value={form.paymentMethod} 
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="btn-outline text-sm"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary text-sm">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteTarget && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          {/* 🔥 DETENER PROPAGACIÓN EN EL MODAL DE ELIMINAR */}
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar Registro?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente este movimiento financiero. 
              <br/><span className="text-xs text-red-400">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}