"use client";

import { useEffect, useState } from "react";
import { Mic2, Search, Plus, X, Check, Play, BookOpen, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Sermon {
  id: number;
  title: string;
  series: string;
  sermonDate: string;
  bibleReference: string;
  tags: string;
  description: string;
  audioUrl: string;
  videoUrl: string;
  pdfUrl: string;
  viewCount: number;
}

const sampleSermons = [
  { title: "El Poder de la Fe", preacher: "Pastor Juan Rodríguez", series: "Fe que Mueve Montañas", date: "10 Nov 2024", reference: "Hebreos 11:1-6", tags: "fe, confianza, milagros", views: 342 },
  { title: "La Gracia Suficiente", preacher: "Rvdo. Carlos Méndez", series: "La Gracia de Dios", date: "03 Nov 2024", reference: "2 Corintios 12:9", tags: "gracia, fortaleza, debilidad", views: 289 },
  { title: "Renovando tu Mente", preacher: "Pastor Juan Rodríguez", series: "Transformación Interior", date: "27 Oct 2024", reference: "Romanos 12:2", tags: "renovación, mente, transformación", views: 415 },
  { title: "El Padre Fiel", preacher: "Rvda. Ana Jiménez", series: "Conociendo a Dios", date: "20 Oct 2024", reference: "Deuteronomio 7:9", tags: "fidelidad, Dios Padre, promesas", views: 267 },
  { title: "Vencedores en Cristo", preacher: "Pastor Juan Rodríguez", series: "Vida Victoriosa", date: "13 Oct 2024", reference: "1 Juan 5:4", tags: "victoria, fe, vencedores", views: 398 },
  { title: "La Oración que Transforma", preacher: "Pastor Auxiliar Pedro Ruiz", series: "El Poder de la Oración", date: "06 Oct 2024", reference: "Mateo 6:9-13", tags: "oración, transformación, poder", views: 521 },
];

export default function Sermons() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "", series: "", sermonDate: new Date().toISOString().split("T")[0],
    bibleReference: "", tags: "", description: "", audioUrl: "", videoUrl: "", pdfUrl: "",
  });

  useEffect(() => {
    fetch(`/api/sermons${search ? `?search=${search}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setSermons(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newS = await res.json();
        setSermons((prev) => [newS, ...prev]);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm({ title: "", series: "", sermonDate: new Date().toISOString().split("T")[0], bibleReference: "", tags: "", description: "", audioUrl: "", videoUrl: "", pdfUrl: "" });
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const display = sermons.length > 0 ? sermons : sampleSermons;
  const filtered = search
    ? display.filter((s) => {
        const title = sermons.length > 0 ? (s as Sermon).title : (s as typeof sampleSermons[0]).title;
        return title.toLowerCase().includes(search.toLowerCase());
      })
    : display;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Base de Datos de Sermones</h2>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} sermones en la biblioteca</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Nuevo Sermón
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título, serie, predicador, etiqueta..."
          className="input-field pl-9 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-premium p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))
        ) : filtered.map((sermon, i) => {
          const isDemo = sermons.length === 0;
          const title = isDemo ? (sermon as typeof sampleSermons[0]).title : (sermon as Sermon).title;
          const preacher = isDemo ? (sermon as typeof sampleSermons[0]).preacher : "Predicador";
          const series = isDemo ? (sermon as typeof sampleSermons[0]).series : (sermon as Sermon).series;
          const date = isDemo ? (sermon as typeof sampleSermons[0]).date : formatDate((sermon as Sermon).sermonDate);
          const reference = isDemo ? (sermon as typeof sampleSermons[0]).reference : (sermon as Sermon).bibleReference;
          const tags = isDemo ? (sermon as typeof sampleSermons[0]).tags : (sermon as Sermon).tags;
          const views = isDemo ? (sermon as typeof sampleSermons[0]).views : (sermon as Sermon).viewCount;

          return (
            <div key={i} className="card-premium p-5 group cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="icon-wrap icon-wrap-primary w-10 h-10">
                  <Mic2 size={18} />
                </div>
                <span className="text-xs text-gray-400">{date}</span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{title}</h3>
              <p className="text-xs text-gray-500 mb-0.5">{preacher}</p>
              {series && <p className="text-xs text-blue-600 font-medium mb-2">Serie: {series}</p>}
              {reference && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <BookOpen size={11} />
                  <span>{reference}</span>
                </div>
              )}
              {tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {tags.split(",").map((tag: string, j: number) => (
                    <span key={j} className="badge badge-info text-xs">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{views} vistas</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                    <Play size={13} />
                  </button>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                    <FileText size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">Nuevo Sermón</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Sermón registrado!</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Título *</label>
                <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del sermón" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Serie</label>
                  <input className="input-field" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} placeholder="Serie o temática" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                  <input type="date" className="input-field" value={form.sermonDate} onChange={(e) => setForm({ ...form, sermonDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Referencia Bíblica</label>
                  <input className="input-field" value={form.bibleReference} onChange={(e) => setForm({ ...form, bibleReference: e.target.value })} placeholder="Juan 3:16" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Etiquetas</label>
                  <input className="input-field" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="fe, amor, gracia" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Resumen del mensaje..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL del Video</label>
                <input className="input-field" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL del Audio</label>
                <input className="input-field" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Guardar Sermón"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
