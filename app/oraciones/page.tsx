"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Heart, Plus, X, Check, Edit2, Trash2, 
  Search, RefreshCw, 
  Clock, CheckCircle, AlertCircle, User,
  MessageSquare, BookOpen, ShieldCheck, Sparkles
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Prayer {
  id: number;
  memberId: number | null;
  requesterName: string | null;
  request: string;
  category: string | null;
  status: 'pending' | 'in_progress' | 'answered' | 'closed';
  responsibleId: number | null;
  response: string | null;
  testimony: string | null;
  isPrivate: boolean;
  requestDate: string;
  answeredDate: string | null;
  createdAt: string;
  updatedAt: string;
  memberFirstName?: string;
  memberLastName?: string;
  memberPhotoUrl?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  answered: "Respondida",
  closed: "Cerrada",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  answered: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

const defaultForm = {
  memberId: "",
  requesterName: "",
  request: "",
  category: "",
  status: "pending" as Prayer['status'],
  responsibleId: "",
  response: "",
  testimony: "",
  isPrivate: false,
  requestDate: new Date().toISOString().split("T")[0],
};

export default function OracionesPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [kpis, setKpis] = useState({ total: 0, pending: 0, answered: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [membersList, setMembersList] = useState<{ id: number; firstName: string; lastName: string }[]>([]);

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
      const params = new URLSearchParams({
        limit: "100",
        search,
        ...(statusFilter && { status: statusFilter }),
      });
      const [resPrayers, resMembers] = await Promise.all([
        fetch(`/api/prayers?${params}`),
        fetch('/api/members?limit=100')
      ]);
      const dataPrayers = await resPrayers.json();
      const dataMembers = await resMembers.json();
      
      setPrayers(dataPrayers.prayers || []);
      setKpis(dataPrayers.kpis || { total: 0, pending: 0, answered: 0 });
      setMembersList(dataMembers.data || []);
    } catch (e) {
      console.error("Error fetching prayers:", e);
      showToast("Error al cargar las peticiones", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/prayers?id=${editingId}` : "/api/prayers";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Petición ${editingId ? 'actualizada' : 'creada'} exitosamente`, 'success');
        setShowModal(false);
        setForm(defaultForm);
        setEditingId(null);
        fetchData();
      } else {
        const data = await res.json();
        showToast(`❌ Error: ${data.error || 'Ocurrió un error'}`, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error de conexión", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prayer: Prayer) => {
    setEditingId(prayer.id);
    setForm({
      memberId: prayer.memberId ? String(prayer.memberId) : "",
      requesterName: prayer.requesterName || "",
      request: prayer.request,
      category: prayer.category || "",
      status: prayer.status,
      responsibleId: prayer.responsibleId ? String(prayer.responsibleId) : "",
      response: prayer.response || "",
      testimony: prayer.testimony || "",
      isPrivate: prayer.isPrivate,
      requestDate: prayer.requestDate.split("T")[0],
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/prayers?id=${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Petición eliminada correctamente", 'success');
        fetchData();
      } else {
        showToast("❌ Error al eliminar la petición", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error al conectar con el servidor", 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Heart size={24} className="text-blue-600" />
            Muro de Oración
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Intercede y gestiona las peticiones de oración de la iglesia
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setForm(defaultForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nueva Petición
        </button>
      </div>

      {/* KPIs SECTION - GLASSMORPHISM STYLE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Total Peticiones</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.total}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 text-white ring-4 ring-white/20">
                <MessageSquare size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-800/60 uppercase tracking-wider">Pendientes</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.pending}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/25 text-white ring-4 ring-white/20">
                <Clock size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-800/60 uppercase tracking-wider">Respondidas</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.answered}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25 text-white ring-4 ring-white/20">
                <CheckCircle size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card-premium p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o petición..."
              className="input-field pl-9 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full sm:w-48 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="answered">Respondida</option>
            <option value="closed">Cerrada</option>
          </select>
          <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center justify-center gap-1 py-2 px-3">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* GRID DE PETICIONES */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-48 animate-pulse bg-white/80">
              <div className="w-full h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : prayers.length === 0 ? (
        <div className="card-premium p-12 text-center bg-white/80 backdrop-blur-sm">
          <Heart size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay peticiones de oración</p>
          <p className="text-gray-400 text-sm mt-1">Sé el primero en compartir una petición</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prayers.map((prayer) => {
            const statusColor = statusColors[prayer.status] || "bg-gray-100 text-gray-700";
            const statusLabel = statusLabels[prayer.status] || prayer.status;

            return (
              <div key={prayer.id} className="card-premium p-5 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group relative flex flex-col">
                
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-3 pr-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {prayer.memberFirstName?.charAt(0)}{prayer.memberLastName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm truncate">
                        {prayer.memberFirstName ? `${prayer.memberFirstName} ${prayer.memberLastName}` : (prayer.requesterName || "Anónimo")}
                      </h4>
                      <p className="text-xs text-gray-400">{formatDate(prayer.requestDate)}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] rounded-full border font-medium shadow-sm ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Contenido de la petición */}
                <div className="flex-1 mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                    {prayer.request}
                  </p>
                  {prayer.category && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      #{prayer.category}
                    </span>
                  )}
                </div>

                {/* Respuesta (si está respondida) */}
                {prayer.status === 'answered' && prayer.response && (
                  <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                      <Sparkles size={14} /> ¡Oración respondida!
                    </p>
                    <p className="text-xs text-green-600 mt-1 line-clamp-2">{prayer.response}</p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleEdit(prayer)} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-blue-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(prayer.id)} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PETICIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar Petición" : "Nueva Petición de Oración"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Petición *</label>
                  <textarea className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" rows={3} required value={form.request} onChange={(e) => setForm({...form, request: e.target.value})} placeholder="Escribe la petición de oración..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Miembro (Opcional)</label>
                    <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.memberId} onChange={(e) => setForm({...form, memberId: e.target.value})}>
                      <option value="">Anónimo / Visitante</option>
                      {membersList.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Categoría</label>
                    <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                      <option value="">General</option>
                      <option value="Salud">Salud</option>
                      <option value="Familia">Familia</option>
                      <option value="Finanzas">Finanzas</option>
                      <option value="Ministerio">Ministerio</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </div>

                {editingId && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Estado</label>
                      <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.status} onChange={(e) => setForm({...form, status: e.target.value as Prayer['status']})}>
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="answered">Respondida</option>
                        <option value="closed">Cerrada</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Fecha de Petición</label>
                      <input type="date" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.requestDate} onChange={(e) => setForm({...form, requestDate: e.target.value})} />
                    </div>
                  </div>
                )}

                {editingId && form.status === 'answered' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Respuesta / Testimonio</label>
                    <textarea className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" rows={3} value={form.response} onChange={(e) => setForm({...form, response: e.target.value})} placeholder="¿Cómo fue respondida esta oración?" />
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isPrivate" checked={form.isPrivate} onChange={(e) => setForm({...form, isPrivate: e.target.checked})} className="w-4 h-4 rounded accent-blue-600" />
                  <label htmlFor="isPrivate" className="text-sm text-gray-600">Petición Privada (solo visible para pastores)</label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving ? "Guardando..." : editingId ? "Actualizar Petición" : "Crear Petición"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Petición</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente esta petición de oración. ¿Estás seguro?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200">Cancelar</button>
              <button onClick={handleDelete} className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md transition-colors duration-200">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}