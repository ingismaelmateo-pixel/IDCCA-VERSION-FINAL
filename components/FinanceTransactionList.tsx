"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Receipt, RefreshCw, Plus, X, Check, Download, AlertCircle, Trash2,
  BarChart2, TrendingUp // 👈 IMPORTACIONES CORREGIDAS Y AGREGADAS
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface FinanceTransactionListProps {
  type: 'tithe' | 'offering' | 'donation' | 'expense' | 'transfer' | 'all';
  title: string;
  color: string;
}

// Configuración de colores para KPIs
const typeConfig: Record<string, { color: string; bgLight: string; iconColor: string }> = {
  tithe: { color: "text-green-600", bgLight: "bg-green-100", iconColor: "text-green-600" },
  offering: { color: "text-blue-600", bgLight: "bg-blue-100", iconColor: "text-blue-600" },
  donation: { color: "text-purple-600", bgLight: "bg-purple-100", iconColor: "text-purple-600" },
  expense: { color: "text-red-600", bgLight: "bg-red-100", iconColor: "text-red-600" },
  transfer: { color: "text-orange-600", bgLight: "bg-orange-100", iconColor: "text-orange-600" },
  all: { color: "text-gray-800", bgLight: "bg-gray-100", iconColor: "text-gray-600" },
};

export default function FinanceTransactionList({ type, title, color }: FinanceTransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: type === 'all' ? 'tithe' : type,
    amount: "",
    description: "",
    memberId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Efectivo",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 🔥 NUEVOS ESTADOS: Para eliminar con confirmación
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTransactions = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        page: String(currentPage),
        ...(type !== 'all' && { type: type }),
      });
      const res = await fetch(`/api/finances?${params}`);
      const data = await res.json();
      if (resetPage) {
        setTransactions(data || []);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...(data || [])]);
      }
      setHasMore(data.length === 20);
    } catch (e) {
      console.error("Error fetching finances:", e);
    } finally {
      setLoading(false);
    }
  }, [page, type]);

  useEffect(() => {
    fetchTransactions(true);
  }, [type]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
    fetchTransactions();
  };

  // 📄 EXPORTAR A PDF
  const handleExportPDF = () => {
    if (transactions.length === 0) {
      showToast("ℹ️ No hay transacciones para exportar.", 'error');
      return;
    }

    const doc = new jsPDF();
    const pdfTitle = `Reporte de ${title} - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(pdfTitle, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total registros: ${transactions.length}`, 14, 28);

    const tableData = transactions.map((t) => [
      `$${parseFloat(t.amount).toLocaleString()}`,
      t.memberFirstName ? `${t.memberFirstName} ${t.memberLastName}` : "—",
      formatDate(t.transactionDate),
      t.paymentMethod || "—",
      t.description || "—"
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Monto", "Miembro", "Fecha", "Método", "Descripción"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
      didParseCell: (data) => {
        if (data.section === 'head') return;
        if (data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    doc.save(`reporte_${title.toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("✅ Reporte exportado exitosamente", "success");
  };

  // 🟢 CRUD: CREAR / EDITAR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/finances?id=${editingId}` : "/api/finances";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Transacción ${editingId ? 'actualizada' : 'creada'}`, 'success');
        setShowModal(false);
        setForm({
          type: type === 'all' ? 'tithe' : type,
          amount: "",
          description: "",
          memberId: "",
          transactionDate: new Date().toISOString().split("T")[0],
          paymentMethod: "Efectivo",
          notes: "",
        });
        setEditingId(null);
        fetchTransactions(true);
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

  // 🔥 Lógica para manejar el botón de eliminar
  const handleDeleteClick = (id: number) => {
    setDeleteTarget(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/finances?id=${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        showToast("🗑️ Transacción eliminada correctamente", 'success');
        fetchTransactions(true);
      } else {
        showToast("❌ Error al eliminar la transacción", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", 'error');
    }
  };

  // KPIs con Glassmorphism
  const totalAmount = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const count = transactions.length;
  const average = count > 0 ? totalAmount / count : 0;
  const config = typeConfig[type === 'all' ? 'all' : type] || typeConfig.all;

  return (
    <div className="space-y-6">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="text-green-500 shrink-0" /> : <AlertCircle size={20} className="text-red-500 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Receipt size={16} /> Registros de {title}
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportPDF} className="btn-outline text-xs flex items-center gap-1 py-1.5 px-3">
            <Download size={14} /> PDF
          </button>
          <button
            onClick={() => { setShowModal(true); setEditingId(null); setForm({...form, type: type === 'all' ? 'tithe' : type, amount: "", description: "", memberId: "", notes: ""}); }}
            className="btn-primary text-xs flex items-center gap-1 py-1.5 px-3"
          >
            <Plus size={14} /> Nuevo
          </button>
        </div>
      </div>

      {/* KPIs PROFESIONALES - Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Total {title}</p>
                <h4 className={`text-3xl font-bold mt-1 ${color}`}>
                  ${totalAmount.toLocaleString()}
                </h4>
              </div>
              <div className={`p-3.5 rounded-2xl ${config.bgLight} ${config.iconColor}`}>
                <Receipt size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-800/60 uppercase tracking-wider">Cantidad</p>
                <h4 className="text-3xl font-bold text-purple-600 mt-1">{count}</h4>
              </div>
              <div className="p-3.5 bg-purple-100 rounded-2xl text-purple-600">
                <BarChart2 size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-800/60 uppercase tracking-wider">Promedio</p>
                <h4 className="text-3xl font-bold text-green-600 mt-1">
                  ${average.toLocaleString()}
                </h4>
              </div>
              <div className="p-3.5 bg-green-100 rounded-2xl text-green-600">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listado con Botón de Eliminar */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Monto</th>
                <th>Miembro</th>
                <th>Fecha</th>
                <th>Método de Pago</th>
                <th>Descripción</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-gray-400">Cargando...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay registros aún.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                    <td className={`font-bold ${color}`}>
                      ${parseFloat(t.amount).toLocaleString()}
                    </td>
                    <td className="text-sm text-gray-600">
                      {t.memberFirstName ? `${t.memberFirstName} ${t.memberLastName}` : "—"}
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(t.transactionDate)}</td>
                    <td className="text-sm text-gray-500">{t.paymentMethod || "—"}</td>
                    <td className="text-sm text-gray-500 max-w-[150px] truncate">{t.description || "—"}</td>
                    <td className="text-center">
                      <button 
                        onClick={() => handleDeleteClick(t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && transactions.length > 0 && (
          <div className="p-4 border-t border-gray-100 text-center">
            <button onClick={loadMore} disabled={loading} className="btn-outline text-sm py-1 px-3">
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE NUEVA TRANSACCIÓN */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingId ? "Editar Movimiento" : "Nuevo Movimiento"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Tipo</label>
                    <select className="input-field" value={form.type} onChange={(e) => setForm({...form, type: e.target.value as any})}>
                      <option value="tithe">Diezmo</option>
                      <option value="offering">Ofrenda</option>
                      <option value="donation">Donación</option>
                      <option value="expense">Gasto</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Monto ($)</label>
                    <input type="number" step="0.01" className="input-field" required value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Descripción</label>
                  <input className="input-field" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Fecha</label>
                    <input type="date" className="input-field" value={form.transactionDate} onChange={(e) => setForm({...form, transactionDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Método de Pago</label>
                    <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})}>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Transacción</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente esta transacción financiera de la base de datos.
              <br/><span className="text-xs text-red-400">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md transition-colors duration-200"
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