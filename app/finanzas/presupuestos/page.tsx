"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, 
  Plus, X, Check, Edit2, Trash2, Calendar, 
  BarChart2, Filter, RefreshCw, Download, Banknote,
  Landmark, Receipt, Percent, PieChart, LineChart,
  AlertCircle, Crown, Building, CalendarDays
} from "lucide-react";
import { formatDate, formatDateShort } from "@/lib/utils";

// Interfaces
interface Budget {
  id: number;
  name: string;
  ministryId: number | null;
  eventId: number | null;
  totalAmount: string;
  usedAmount: string;
  year: number;
  month: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  ministryName?: string;
}

const defaultForm = {
  name: "",
  ministryId: "",
  eventId: "",
  totalAmount: "",
  usedAmount: "",
  year: new Date().getFullYear(),
  month: "",
  description: "",
  isActive: true,
};

export default function PresupuestosPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [ministries, setMinistries] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resBudgets, resMinistries] = await Promise.all([
        fetch(`/api/budgets?year=${filterYear}`),
        fetch(`/api/ministries?limit=100`)
      ]);
      const dataBudgets = await resBudgets.json();
      const dataMinistries = await resMinistries.json();
      
      setBudgets(dataBudgets || []);
      setMinistries(dataMinistries.data || []);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/budgets?id=${editingId}` : "/api/budgets";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Presupuesto ${editingId ? 'actualizado' : 'creado'} exitosamente`, 'success');
        setShowModal(false);
        setForm(defaultForm);
        setEditingId(null);
        fetchData();
      } else {
        const data = await res.json();
        showToast(`❌ Error: ${data.error || 'Ocurrió un error'}`, 'error');
      }
    } catch (error) {
      showToast("❌ Error de conexión", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setForm({
      name: budget.name,
      ministryId: budget.ministryId ? String(budget.ministryId) : "",
      eventId: budget.eventId ? String(budget.eventId) : "",
      totalAmount: budget.totalAmount,
      usedAmount: budget.usedAmount || "0",
      year: budget.year,
      month: budget.month ? String(budget.month) : "",
      description: budget.description || "",
      isActive: budget.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/budgets?id=${deleteTarget}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchData();
    showToast("🗑️ Presupuesto eliminado correctamente", 'success');
  };

  // ============================================================
  // KPIS CALCULATION
  // ============================================================
  const totalBudget = budgets.reduce((acc, curr) => acc + parseFloat(curr.totalAmount), 0);
  const totalUsed = budgets.reduce((acc, curr) => acc + parseFloat(curr.usedAmount || "0"), 0);
  const executionRate = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  const activeBudgets = budgets.filter(b => b.isActive).length;

  // Generar años para el filtro (desde 2020 hasta 5 años en el futuro)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2020; y <= currentYear + 5; y++) {
    years.push(y);
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 animate-in slide-in-from-top-5 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="text-green-500 flex-shrink-0" /> : <AlertCircle size={20} className="text-red-500 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <PieChart size={24} className="text-blue-600" />
            Presupuestos
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Planifica y gestiona los presupuestos de los ministerios
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setForm(defaultForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nuevo Presupuesto
        </button>
      </div>

      {/* FILTRO DE AÑO */}
      <div className="card-premium p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">Año fiscal:</span>
          <select 
            className="input-field w-32 text-sm py-1.5"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center gap-1 py-1 px-3">
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* KPIs SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Presupuesto Total</p>
              <h4 className="text-2xl font-bold text-blue-900 mt-1">${totalBudget.toLocaleString()}</h4>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Wallet size={20} /></div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Gastado</p>
              <h4 className="text-2xl font-bold text-orange-600 mt-1">${totalUsed.toLocaleString()}</h4>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><TrendingDown size={20} /></div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Ejecución</p>
              <h4 className="text-2xl font-bold text-green-600 mt-1">{executionRate}%</h4>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-600"><Percent size={20} /></div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Presupuestos Activos</p>
              <h4 className="text-2xl font-bold text-purple-600 mt-1">{activeBudgets}</h4>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600"><Check size={20} /></div>
          </div>
        </div>
      </div>

      {/* GRID DE PRESUPUESTOS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-48">
              <div className="skeleton h-6 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-8 w-full" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <PieChart size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">No hay presupuestos para el año {filterYear}</p>
          <p className="text-gray-300 text-sm mt-1">Crea el primer presupuesto usando el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const total = parseFloat(budget.totalAmount);
            const used = parseFloat(budget.usedAmount || "0");
            const progress = total > 0 ? Math.min((used / total) * 100, 100) : 0;
            const ministry = ministries.find(m => m.id === budget.ministryId);

            return (
              <div key={budget.id} className="card-premium p-5 hover:shadow-lg transition-shadow group relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{budget.name}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Building size={12} />
                      {ministry?.name || "General"}
                    </p>
                  </div>
                  {budget.isActive ? (
                    <span className="badge badge-success text-[10px]">Activo</span>
                  ) : (
                    <span className="badge badge-danger text-[10px]">Inactivo</span>
                  )}
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Presupuesto</p>
                    <p className="font-semibold text-gray-800">${total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Gastado</p>
                    <p className="font-semibold text-orange-600">${used.toLocaleString()}</p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${progress >= 100 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{progress.toFixed(0)}% ejecutado</span>
                    <span className="text-[10px] text-gray-400">${(total - used).toLocaleString()} disponible</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(budget)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white rounded-lg shadow-sm"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget(budget.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-lg shadow-sm"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR/EDITAR PRESUPUESTO */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del Presupuesto *</label>
                  <input className="input-field" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Ej: Presupuesto Anual 2026" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ministerio</label>
                  <select className="input-field" value={form.ministryId} onChange={(e) => setForm({...form, ministryId: e.target.value})}>
                    <option value="">General (Sin ministerio)</option>
                    {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Monto Total ($) *</label>
                    <input type="number" step="0.01" className="input-field" required value={form.totalAmount} onChange={(e) => setForm({...form, totalAmount: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Monto Gastado ($)</label>
                    <input type="number" step="0.01" className="input-field" value={form.usedAmount} onChange={(e) => setForm({...form, usedAmount: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Año *</label>
                    <select className="input-field" required value={form.year} onChange={(e) => setForm({...form, year: parseInt(e.target.value)})}>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Mes (Opcional)</label>
                    <select className="input-field" value={form.month} onChange={(e) => setForm({...form, month: e.target.value})}>
                      <option value="">Todo el año</option>
                      <option value="1">Enero</option>
                      <option value="2">Febrero</option>
                      <option value="3">Marzo</option>
                      <option value="4">Abril</option>
                      <option value="5">Mayo</option>
                      <option value="6">Junio</option>
                      <option value="7">Julio</option>
                      <option value="8">Agosto</option>
                      <option value="9">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                  <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Detalles del presupuesto..." />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 rounded" />
                  <label htmlFor="isActive" className="text-sm text-gray-600">Presupuesto Activo</label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Presupuesto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Presupuesto</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente este presupuesto. ¿Estás seguro?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}