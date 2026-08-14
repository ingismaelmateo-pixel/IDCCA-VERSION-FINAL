"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Megaphone, Plus, X, Check, Edit2, Trash2, 
  Search, RefreshCw, 
  Globe, Eye, EyeOff, Pin, Calendar,
  MessageSquare, Users, Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number | null;
  targetAudience: string;
  publishDate: string;
  expiryDate: string | null;
  isPinned: boolean;
  isPublished: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  authorFirstName?: string;
  authorLastName?: string;
}

const defaultForm = {
  title: "",
  content: "",
  authorId: "",
  targetAudience: "all",
  publishDate: new Date().toISOString().split("T")[0] + "T00:00",
  expiryDate: "",
  isPinned: false,
  isPublished: false,
  imageUrl: "",
};

export default function ComunicacionPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [kpis, setKpis] = useState({ total: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPublished, setFilterPublished] = useState<string>("");
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
        ...(filterPublished && { isPublished: filterPublished }),
      });
      const [resAnnouncements, resMembers] = await Promise.all([
        fetch(`/api/announcements?${params}`),
        fetch('/api/members?limit=100')
      ]);
      const dataAnnouncements = await resAnnouncements.json();
      const dataMembers = await resMembers.json();
      
      setAnnouncements(dataAnnouncements.announcements || []);
      setKpis(dataAnnouncements.kpis || { total: 0, published: 0 });
      setMembersList(dataMembers.data || []);
    } catch (e) {
      console.error("Error fetching announcements:", e);
      showToast("Error al cargar anuncios", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterPublished]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ============================================================
  // TOGGLE PUBLICACIÓN
  // ============================================================
  const togglePublish = async (id: number, currentState: boolean) => {
    try {
      const res = await fetch(`/api/announcements?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentState }),
      });
      if (res.ok) {
        fetchData();
        showToast(currentState ? "🔒 Anuncio ocultado" : "🌍 Anuncio publicado", 'success');
      } else {
        showToast("❌ Error al cambiar el estado", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", 'error');
    }
  };

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/announcements?id=${editingId}` : "/api/announcements";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Anuncio ${editingId ? 'actualizado' : 'creado'} exitosamente`, 'success');
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

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      authorId: item.authorId ? String(item.authorId) : "",
      targetAudience: item.targetAudience,
      publishDate: item.publishDate.split("T")[0] + "T" + item.publishDate.split("T")[1].slice(0, 5),
      expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] + "T" + item.expiryDate.split("T")[1].slice(0, 5) : "",
      isPinned: item.isPinned,
      isPublished: item.isPublished,
      imageUrl: item.imageUrl || "",
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/announcements?id=${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Anuncio eliminado correctamente", 'success');
        fetchData();
      } else {
        showToast("❌ Error al eliminar el anuncio", 'error');
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
            <Megaphone size={24} className="text-blue-600" />
            Comunicación y Anuncios
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Crea y gestiona los anuncios y comunicaciones de la iglesia
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setForm(defaultForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nuevo Anuncio
        </button>
      </div>

      {/* KPIs SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Total Anuncios</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.total}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 text-white ring-4 ring-white/20">
                <MessageSquare size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-800/60 uppercase tracking-wider">Publicados</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.published}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25 text-white ring-4 ring-white/20">
                <Globe size={22} strokeWidth={2.5} />
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
              placeholder="Buscar por título o contenido..."
              className="input-field pl-9 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full sm:w-48 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
          >
            <option value="">Todos los anuncios</option>
            <option value="true">Publicados</option>
            <option value="false">Borradores</option>
          </select>
          <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center justify-center gap-1 py-2 px-3">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* LISTA DE ANUNCIOS (Tipo Muro) */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-premium p-5 h-32 animate-pulse bg-white/80">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="card-premium p-12 text-center bg-white/80 backdrop-blur-sm">
          <Megaphone size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay anuncios aún</p>
          <p className="text-gray-400 text-sm mt-1">Crea el primer anuncio haciendo clic en "Nuevo Anuncio"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className={`card-premium p-5 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group relative flex flex-col md:flex-row gap-4 ${item.isPinned ? 'border-l-4 border-amber-500' : ''}`}>
              
              {/* Imagen (si existe) */}
              {item.imageUrl && (
                <div className="w-full md:w-24 h-24 md:h-auto shrink-0">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                </div>
              )}

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-lg">{item.title}</h4>
                    {item.isPinned && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1"><Pin size={12} /> Fijado</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {item.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => togglePublish(item.id, item.isPublished)} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-blue-600" title={item.isPublished ? "Ocultar" : "Publicar"}>
                      {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => handleEdit(item)} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-blue-600">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {item.content}
                </p>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Users size={12} /> {item.authorFirstName ? `${item.authorFirstName} ${item.authorLastName}` : 'Anónimo'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(item.publishDate)}
                  </span>
                  {item.expiryDate && (
                    <span className="flex items-center gap-1.5 text-red-500">
                      <AlertCircle size={12} /> Expira: {formatDate(item.expiryDate)}
                    </span>
                  )}
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.targetAudience === 'all' ? '🌍 Todos' : item.targetAudience}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR ANUNCIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar Anuncio" : "Nuevo Anuncio"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Título *</label>
                  <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Contenido *</label>
                  <textarea className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" rows={5} required value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="Escribe el anuncio aquí..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Autor (Miembro)</label>
                    <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.authorId} onChange={(e) => setForm({...form, authorId: e.target.value})}>
                      <option value="">Anónimo</option>
                      {membersList.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Público Objetivo</label>
                    <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.targetAudience} onChange={(e) => setForm({...form, targetAudience: e.target.value})}>
                      <option value="all">Todos</option>
                      <option value="members">Miembros</option>
                      <option value="leaders">Líderes</option>
                      <option value="pastors">Pastores</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Fecha de Publicación</label>
                    <input type="datetime-local" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.publishDate} onChange={(e) => setForm({...form, publishDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Fecha de Expiración</label>
                    <input type="datetime-local" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">URL de Imagen</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})} placeholder="https://ejemplo.com/imagen.jpg" />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={(e) => setForm({...form, isPinned: e.target.checked})} className="w-4 h-4 rounded accent-blue-600" />
                    <label htmlFor="isPinned" className="text-sm text-gray-600">Fijar al inicio</label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={(e) => setForm({...form, isPublished: e.target.checked})} className="w-4 h-4 rounded accent-blue-600" />
                  <label htmlFor="isPublished" className="text-sm text-gray-600">Publicar inmediatamente</label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving ? "Guardando..." : editingId ? "Actualizar Anuncio" : "Crear Anuncio"}
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Anuncio</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente este anuncio. ¿Estás seguro?</p>
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