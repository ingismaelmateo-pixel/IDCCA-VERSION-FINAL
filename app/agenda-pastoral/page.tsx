"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Calendar, Clock, Users, MapPin, Plus, X, Check, 
  Edit2, Trash2, Phone, Mail, Home, User, 
  BarChart2, TrendingUp, ChevronLeft, ChevronRight,
  CalendarDays, AlertCircle, RefreshCw, UserCheck, Search
} from "lucide-react";
import { formatDate, formatDateShort } from "@/lib/utils";

// Interfaces
interface PastoralVisit {
  id: number;
  memberId: number;
  pastorId: number | null;
  visitType: string;
  visitDate: string;
  duration: number | null;
  notes: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  memberFirstName?: string;
  memberLastName?: string;
  pastorFirstName?: string;
  pastorLastName?: string;
}

// Definimos el tipo para el estado del formulario
type StatusType = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// 🌟 MAPAS DE TRADUCCIÓN Y COLORES PARA LOS ESTADOS
const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  scheduled: "badge-info",
  in_progress: "badge-warning",
  completed: "badge-success",
  cancelled: "badge-danger",
};

// Estado del Formulario
const defaultForm = {
  memberId: "",
  pastorId: "",
  visitType: "General",
  visitDate: "",
  duration: "",
  notes: "",
  followUpRequired: false,
  followUpDate: "",
  status: "scheduled" as StatusType,
};

export default function PastoralPage() {
  const [visits, setVisits] = useState<PastoralVisit[]>([]);
  const [membersList, setMembersList] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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
      const [resVisits, resMembers] = await Promise.all([
        fetch(`/api/pastoral-visits?limit=100`),
        fetch(`/api/members?limit=100`)
      ]);
      const dataVisits = await resVisits.json();
      const dataMembers = await resMembers.json();
      
      setVisits(dataVisits || []);
      setMembersList(dataMembers.data || []);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/pastoral-visits?id=${editingId}` : "/api/pastoral-visits";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Visita ${editingId ? 'actualizada' : 'creada'} exitosamente`, 'success');
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/pastoral-visits?id=${deleteTarget}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchData();
    showToast("🗑️ Visita eliminada correctamente", 'success');
  };

  const handleEdit = (visit: PastoralVisit) => {
    setEditingId(visit.id);
    setForm({
      memberId: String(visit.memberId),
      pastorId: visit.pastorId ? String(visit.pastorId) : "",
      visitType: visit.visitType || "General",
      visitDate: visit.visitDate.split("T")[0] + "T" + visit.visitDate.split("T")[1].slice(0, 5),
      duration: String(visit.duration || ""),
      notes: visit.notes || "",
      followUpRequired: visit.followUpRequired,
      followUpDate: visit.followUpDate ? visit.followUpDate.split("T")[0] + "T" + visit.followUpDate.split("T")[1].slice(0, 5) : "",
      status: visit.status as StatusType,
    });
    setShowModal(true);
  };

  // ============================================================
  // KPIS CALCULATION
  // ============================================================
  const today = new Date().toISOString().split("T")[0];
  const visitsToday = visits.filter(v => v.visitDate.split("T")[0] === today && v.status !== 'cancelled').length;
  const visitsScheduled = visits.filter(v => v.status === 'scheduled').length;
  const visitsCompleted = visits.filter(v => v.status === 'completed').length;
  const totalVisits = visits.length;
  const completionRate = totalVisits > 0 ? Math.round((visitsCompleted / totalVisits) * 100) : 0;

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
            <CalendarDays size={24} className="text-blue-600" />
            Agenda Pastoral
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Gestiona las visitas, consejerías y acompañamientos pastorales
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setForm(defaultForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nueva Visita
        </button>
      </div>

      {/* KPIs SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Visitas Hoy</p>
              <h4 className="text-2xl font-bold text-blue-900 mt-1">{loading ? "..." : visitsToday}</h4>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Calendar size={20} /></div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Pendientes</p>
              <h4 className="text-2xl font-bold text-orange-600 mt-1">{loading ? "..." : visitsScheduled}</h4>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><Clock size={20} /></div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Tasa de Cumplimiento</p>
              <h4 className="text-2xl font-bold text-green-600 mt-1">{loading ? "..." : `${completionRate}%`}</h4>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-600"><TrendingUp size={20} /></div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Agendadas</p>
              <h4 className="text-2xl font-bold text-purple-600 mt-1">{loading ? "..." : totalVisits}</h4>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600"><BarChart2 size={20} /></div>
          </div>
        </div>
      </div>

      {/* LISTADO DE VISITAS */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} /> Historial y Próximas Visitas
          </h3>
          <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center gap-1 py-1 px-3">
            <RefreshCw size={12} /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Fecha y Hora</th>
                <th>Tipo</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
              ) : visits.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <CalendarDays size={32} className="mx-auto mb-2 text-gray-200" />
                  No hay visitas registradas.
                </td></tr>
              ) : (
                visits.map((v) => {
                  const member = membersList.find(m => m.id === v.memberId);
                  const pastor = v.pastorId ? membersList.find(m => m.id === v.pastorId) : null;

                  return (
                    <tr key={v.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="font-medium text-sm">{member?.firstName} {member?.lastName || "Eliminado"}</td>
                      <td className="text-sm text-gray-600">{formatDate(v.visitDate)}</td>
                      <td className="text-sm text-gray-600">{v.visitType}</td>
                      <td className="text-sm text-gray-600">{pastor?.firstName ? `${pastor.firstName} ${pastor.lastName}` : "—"}</td>
                      <td>
                        {/* 🌟 TRADUCTOR DE ESTADO EN LA TABLA */}
                        <span className={`badge ${statusColors[v.status] || "badge-info"}`}>
                          {statusLabels[v.status] || v.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(v)} className="p-1 text-gray-500 hover:text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteTarget(v.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR VISITA */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar Visita" : "Nueva Visita Pastoral"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Miembro *</label>
                  <select className="input-field" required value={form.memberId} onChange={(e) => setForm({...form, memberId: e.target.value})}>
                    <option value="">Seleccionar Miembro</option>
                    {membersList.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Pastor / Responsable</label>
                  <select className="input-field" value={form.pastorId} onChange={(e) => setForm({...form, pastorId: e.target.value})}>
                    <option value="">Seleccionar Responsable</option>
                    {membersList.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Visita</label>
                    <select className="input-field" value={form.visitType} onChange={(e) => setForm({...form, visitType: e.target.value})}>
                      <option value="General">General</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Domicilio">Domicilio</option>
                      <option value="Consejería">Consejería</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    {/* 🌟 TRADUCTOR DE ESTADO EN EL MODAL */}
                    <select className="input-field" value={form.status} onChange={(e) => setForm({...form, status: e.target.value as StatusType})}>
                      <option value="scheduled">Programada</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha y Hora *</label>
                    <input type="datetime-local" className="input-field" required value={form.visitDate} onChange={(e) => setForm({...form, visitDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Duración (Minutos)</label>
                    <input type="number" className="input-field" value={form.duration} onChange={(e) => setForm({...form, duration: e.target.value})} placeholder="60" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
                  <textarea className="input-field resize-none" rows={3} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Detalles de la visita..." />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="followUp" checked={form.followUpRequired} onChange={(e) => setForm({...form, followUpRequired: e.target.checked})} className="w-4 h-4 rounded" />
                  <label htmlFor="followUp" className="text-sm text-gray-600">Requiere Seguimiento</label>
                </div>

                {form.followUpRequired && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Seguimiento</label>
                    <input type="datetime-local" className="input-field" value={form.followUpDate} onChange={(e) => setForm({...form, followUpDate: e.target.value})} />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving ? "Guardando..." : editingId ? "Actualizar" : "Agendar Visita"}
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Visita</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente esta visita de la agenda. ¿Estás seguro?</p>
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