"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mic2, Search, Plus, X, Check, Play, BookOpen, FileText,
  Video, Music, Presentation, Edit2, Trash2, Eye, Tag,
  TrendingUp, Layers, Calendar, User, ExternalLink, SortDesc,
  AlertCircle // <-- Agregado para el Toast
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Sermon {
  id: number;
  title: string;
  preacherId: number | null;
  preacherName: string | null;
  series: string | null;
  sermonDate: string;
  audioUrl: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  presentationUrl: string | null;
  bibleReference: string | null;
  tags: string | null;
  description: string | null;
  viewCount: number;
  createdAt: string;
}

interface MemberOption {
  id: number;
  firstName: string;
  lastName: string;
}

const defaultForm = {
  title: "",
  preacherId: "",
  series: "",
  sermonDate: new Date().toISOString().split("T")[0],
  bibleReference: "",
  tags: "",
  description: "",
  audioUrl: "",
  videoUrl: "",
  pdfUrl: "",
  presentationUrl: "",
};

export default function SermonesPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("");
  const [sort, setSort] = useState("recent");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Sermon | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🟢 NUEVOS ESTADOS PARA EL MODAL DE ELIMINACIÓN Y TOAST
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSermons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(seriesFilter && { series: seriesFilter }),
        sort,
      });
      const res = await fetch(`/api/sermons?${params}`);
      const data = await res.json();
      setSermons(data.data || []);
    } catch (e) {
      console.error("Error fetchSermons:", e);
      setSermons([]);
    } finally {
      setLoading(false);
    }
  }, [search, seriesFilter, sort]);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  // Carga la lista de miembros para el selector de predicador
  useEffect(() => {
    fetch("/api/members?limit=500")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.data || [];
        setMembers(list);
      })
      .catch(() => setMembers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/sermons/${editingId}` : "/api/sermons";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        showToast("✅ Sermón guardado exitosamente", "success");
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm(defaultForm);
          setEditingId(null);
          fetchSermons();
        }, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`❌ ${data.error || "No se pudo guardar el sermón."}`, "error");
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error de conexión con el servidor.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s: Sermon) => {
    setEditingId(s.id);
    setForm({
      title: s.title || "",
      preacherId: s.preacherId ? String(s.preacherId) : "",
      series: s.series || "",
      sermonDate: s.sermonDate || "",
      bibleReference: s.bibleReference || "",
      tags: s.tags || "",
      description: s.description || "",
      audioUrl: s.audioUrl || "",
      videoUrl: s.videoUrl || "",
      pdfUrl: s.pdfUrl || "",
      presentationUrl: s.presentationUrl || "",
    });
    setShowDetail(null);
    setShowModal(true);
  };

  // 🔥 NUEVA LÓGICA PARA ABRIR EL MODAL DE ELIMINACIÓN
  const handleDeleteClick = (id: number) => {
    setDeleteTarget(id);
  };

  // 🔥 NUEVA LÓGICA PARA ELIMINAR DESDE EL MODAL
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/sermons/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        setShowDetail(null);
        showToast("🗑️ Sermón eliminado correctamente", "success");
        fetchSermons();
      } else {
        showToast("❌ Error al eliminar el sermón", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error de conexión", "error");
    }
  };

  const handlePlay = async (s: Sermon, url: string) => {
    window.open(url, "_blank");
    try {
      await fetch(`/api/sermons/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementView: true }),
      });
      fetchSermons();
    } catch {}
  };

  // KPIs
  const totalSermons = sermons.length;
  const totalViews = sermons.reduce((acc, s) => acc + (s.viewCount || 0), 0);
  const uniqueSeries = new Set(sermons.filter((s) => s.series).map((s) => s.series)).size;
  const thisMonthCount = sermons.filter((s) => {
    if (!s.sermonDate) return false;
    const d = new Date(s.sermonDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const seriesOptions = Array.from(new Set(sermons.filter((s) => s.series).map((s) => s.series as string)));

  return (
    <div className="space-y-6">
      
      {/* 🟢 TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="text-green-500 shrink-0" /> : <AlertCircle size={20} className="text-red-500 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Base de Datos de Sermones</h2>
          <p className="text-gray-400 text-sm mt-0.5">{totalSermons} sermones en la biblioteca</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(defaultForm); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nuevo Sermón
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-premium p-4 text-center">
          <div className="flex items-center justify-center mb-1.5">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Mic2 size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-blue-900">{totalSermons}</p>
          <p className="text-xs text-gray-400">Sermones</p>
        </div>
        <div className="card-premium p-4 text-center">
          <div className="flex items-center justify-center mb-1.5">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
              <Eye size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600">{totalViews}</p>
          <p className="text-xs text-gray-400">Vistas totales</p>
        </div>
        <div className="card-premium p-4 text-center">
          <div className="flex items-center justify-center mb-1.5">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-purple-600">{uniqueSeries}</p>
          <p className="text-xs text-gray-400">Series activas</p>
        </div>
        <div className="card-premium p-4 text-center">
          <div className="flex items-center justify-center mb-1.5">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-orange-600">{thisMonthCount}</p>
          <p className="text-xs text-gray-400">Este mes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, serie, referencia, etiqueta..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field w-full sm:w-48" value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)}>
            <option value="">Todas las series</option>
            {seriesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field w-full sm:w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Más recientes</option>
            <option value="views">Más vistos</option>
          </select>
        </div>
      </div>

      {/* Grid de sermones */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-premium p-5">
              <div className="skeleton h-24 w-full mb-3 rounded-xl" />
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))
        ) : sermons.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Mic2 size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">Aún no hay sermones registrados</p>
            <p className="text-gray-300 text-sm mt-1">Registra el primer sermón usando el botón de arriba</p>
          </div>
        ) : (
          sermons.map((s) => (
            <div
              key={s.id}
              onClick={() => setShowDetail(s)}
              className="card-premium overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Cabecera con degradado */}
              <div
                className="p-4 relative"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                    <Mic2 size={20} />
                  </div>
                  {s.series && (
                    <span className="text-xs font-medium bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur">
                      {s.series}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-bold text-base mt-3 leading-tight line-clamp-2">{s.title}</h3>
                <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1.5">
                  <User size={11} />
                  <span>{s.preacherName?.trim() || "Predicador no asignado"}</span>
                </div>
              </div>

              {/* Cuerpo */}
              <div className="p-4">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{formatDate(s.sermonDate)}</span>
                  </div>
                  {s.bibleReference && (
                    <div className="flex items-center gap-1">
                      <BookOpen size={12} className="text-gray-400" />
                      <span>{s.bibleReference}</span>
                    </div>
                  )}
                </div>

                {s.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {s.tags.split(",").slice(0, 3).map((tag, j) => (
                      <span key={j} className="badge badge-info text-xs">
                        <Tag size={9} className="inline mr-0.5" />
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye size={12} /> {s.viewCount || 0} vistas
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {s.videoUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlay(s, s.videoUrl!); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50"
                        title="Ver video"
                      >
                        <Video size={13} />
                      </button>
                    )}
                    {s.audioUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlay(s, s.audioUrl!); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-50"
                        title="Escuchar audio"
                      >
                        <Music size={13} />
                      </button>
                    )}
                    {s.pdfUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlay(s, s.pdfUrl!); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                        title="Ver notas PDF"
                      >
                        <FileText size={13} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-yellow-600 hover:bg-yellow-50"
                      title="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                    {/* 🔥 BOTÓN DE ELIMINAR AHORA LLAMA A handleDeleteClick */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(s.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalle */}
      {showDetail && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal-content max-w-lg">
            <div
              className="p-6 rounded-t-2xl relative"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
            >
              <button
                onClick={() => setShowDetail(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white mb-3">
                <Mic2 size={22} />
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">{showDetail.title}</h3>
              <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
                <User size={13} />
                <span>{showDetail.preacherName?.trim() || "Predicador no asignado"}</span>
              </div>
              {showDetail.series && (
                <span className="inline-block mt-2 text-xs font-medium bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur">
                  Serie: {showDetail.series}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(showDetail.sermonDate)}</span>
                {showDetail.bibleReference && (
                  <span className="flex items-center gap-1"><BookOpen size={12} /> {showDetail.bibleReference}</span>
                )}
                <span className="flex items-center gap-1"><Eye size={12} /> {showDetail.viewCount || 0} vistas</span>
              </div>

              {showDetail.description && (
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Descripción</p>
                  <p className="text-sm text-gray-700">{showDetail.description}</p>
                </div>
              )}

              {showDetail.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {showDetail.tags.split(",").map((tag, j) => (
                    <span key={j} className="badge badge-info text-xs">{tag.trim()}</span>
                  ))}
                </div>
              )}

              {showDetail.audioUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Music size={12} /> Audio</p>
                  <audio controls className="w-full" src={showDetail.audioUrl} />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {showDetail.videoUrl && (
                  <button onClick={() => handlePlay(showDetail, showDetail.videoUrl!)} className="btn-outline text-sm flex items-center gap-1.5">
                    <Video size={14} /> Ver video <ExternalLink size={11} />
                  </button>
                )}
                {showDetail.pdfUrl && (
                  <button onClick={() => handlePlay(showDetail, showDetail.pdfUrl!)} className="btn-outline text-sm flex items-center gap-1.5">
                    <FileText size={14} /> Notas PDF <ExternalLink size={11} />
                  </button>
                )}
                {showDetail.presentationUrl && (
                  <button onClick={() => handlePlay(showDetail, showDetail.presentationUrl!)} className="btn-outline text-sm flex items-center gap-1.5">
                    <Presentation size={14} /> Presentación <ExternalLink size={11} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => handleEdit(showDetail)} className="btn-primary flex-1">Editar</button>
                {/* 🔥 ELIMINAR EN EL MODAL DE DETALLE TAMBIÉN LLAMA AL MODAL */}
                <button onClick={() => handleDeleteClick(showDetail.id)} className="btn-outline flex-1 text-red-500 border-red-200 hover:bg-red-50">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">
                {editingId ? "Editar Sermón" : "Nuevo Sermón"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Sermón guardado exitosamente!</span>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Mic2 size={14} /> Información General
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Título *</label>
                    <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del sermón" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Predicador</label>
                    <select className="input-field" value={form.preacherId} onChange={(e) => setForm({ ...form, preacherId: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha *</label>
                    <input type="date" className="input-field" required value={form.sermonDate} onChange={(e) => setForm({ ...form, sermonDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Serie</label>
                    <input className="input-field" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} placeholder="Serie o temática" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Referencia Bíblica</label>
                    <input className="input-field" value={form.bibleReference} onChange={(e) => setForm({ ...form, bibleReference: e.target.value })} placeholder="Juan 3:16" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Etiquetas</label>
                    <input className="input-field" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="fe, amor, gracia (separadas por coma)" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                    <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Resumen del mensaje..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Video size={14} /> Recursos Multimedia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">URL del Video</label>
                    <input className="input-field" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">URL del Audio</label>
                    <input className="input-field" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">URL del PDF (notas)</label>
                    <input className="input-field" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">URL de Presentación</label>
                    <input className="input-field" value={form.presentationUrl} onChange={(e) => setForm({ ...form, presentationUrl: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar Sermón"}
                </button>
              </div>
            </form>
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Sermón</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente este sermón de la base de datos.
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