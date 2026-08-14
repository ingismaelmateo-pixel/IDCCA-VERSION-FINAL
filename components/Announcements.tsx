"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, X, Check, Pin } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  publishDate: string;
  expiryDate: string;
  isPinned: boolean;
  isPublished: boolean;
  imageUrl: string;
  createdAt: string;
}

const sampleAnnouncements = [
  { title: "Vigilia de Oración - Viernes 15 Nov", content: "¡Esta noche hay Vigilia de Oración! Comenzamos a las 10:00 PM. Ven y experimenta la presencia del Señor en una noche de adoración e intercesión.", audience: "all", date: "13 Nov 2024", pinned: true, published: true },
  { title: "Retiro de Jóvenes 2024", content: "Inscripciones abiertas para el Retiro de Jóvenes 2024. Fecha: 16-17 Noviembre. Precio: RD$1,500. Incluye alimentación y hospedaje. ¡Cupos limitados!", audience: "youth", date: "10 Nov 2024", pinned: true, published: true },
  { title: "Congreso de Familias - Noviembre", content: "Los esperamos en nuestro Gran Congreso de Familias. Un tiempo especial para fortalecer el hogar cristiano. Oradores invitados de nivel nacional.", audience: "all", date: "08 Nov 2024", pinned: false, published: true },
  { title: "Clases de Bautismo", content: "Se abren nuevas clases de bautismo para todos los nuevos creyentes. Inscríbete en la recepción. Fechas: Lunes y Miércoles a las 7PM.", audience: "visitors", date: "05 Nov 2024", pinned: false, published: true },
  { title: "Voluntarios para Proyecto Comunitario", content: "¡Necesitamos voluntarios para nuestro proyecto de evangelismo comunitario este sábado! Punto de encuentro a las 8:00 AM en el templo.", audience: "members", date: "01 Nov 2024", pinned: false, published: false },
];

const audienceLabels: Record<string, string> = {
  all: "Toda la Congregación",
  members: "Solo Miembros",
  youth: "Jóvenes",
  leaders: "Líderes",
  visitors: "Visitantes",
};

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", targetAudience: "all",
    publishDate: "", expiryDate: "", isPinned: false, isPublished: true,
  });

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => { setAnnouncements(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newA = await res.json();
        setAnnouncements((prev) => [newA, ...prev]);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm({ title: "", content: "", targetAudience: "all", publishDate: "", expiryDate: "", isPinned: false, isPublished: true });
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const display = announcements.length > 0 ? announcements : sampleAnnouncements;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Anuncios y Comunicación</h2>
          <p className="text-gray-400 text-sm mt-0.5">{display.length} anuncios registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Nuevo Anuncio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {display.map((ann, i) => {
          const isDemo = announcements.length === 0;
          const title = isDemo ? (ann as typeof sampleAnnouncements[0]).title : (ann as Announcement).title;
          const content = isDemo ? (ann as typeof sampleAnnouncements[0]).content : (ann as Announcement).content;
          const audience = isDemo ? (ann as typeof sampleAnnouncements[0]).audience : (ann as Announcement).targetAudience;
          const date = isDemo ? (ann as typeof sampleAnnouncements[0]).date : formatDate((ann as Announcement).createdAt);
          const pinned = isDemo ? (ann as typeof sampleAnnouncements[0]).pinned : (ann as Announcement).isPinned;
          const published = isDemo ? (ann as typeof sampleAnnouncements[0]).published : (ann as Announcement).isPublished;

          return (
            <div key={i} className={`card-premium p-5 ${pinned ? "border-yellow-200 bg-yellow-50/30" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`icon-wrap w-9 h-9 ${pinned ? "icon-wrap-gold" : "icon-wrap-primary"}`}>
                    {pinned ? <Pin size={15} /> : <Bell size={15} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{title}</h3>
                    <p className="text-xs text-gray-400">{date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {pinned && <span className="badge badge-gold text-xs">📌 Fijado</span>}
                  <span className={`badge ${published ? "badge-success" : "badge-warning"}`}>
                    {published ? "Publicado" : "Borrador"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{content}</p>
              <div className="flex items-center justify-between">
                <span className="badge badge-info text-xs">{audienceLabels[audience] || audience}</span>
                <div className="flex gap-2">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                  <span className="text-gray-300">·</span>
                  <button className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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
              <h3 className="font-bold text-lg text-blue-900">Nuevo Anuncio</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Anuncio publicado!</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Título *</label>
                <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del anuncio" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Contenido *</label>
                <textarea className="input-field resize-none" required rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Texto del anuncio..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Audiencia</label>
                  <select className="input-field" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                    {Object.entries(audienceLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Publicación</label>
                  <input type="datetime-local" className="input-field" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="w-4 h-4 rounded accent-blue-900" />
                  <label htmlFor="isPinned" className="text-sm text-gray-600">Fijar anuncio</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded accent-blue-900" />
                  <label htmlFor="isPublished" className="text-sm text-gray-600">Publicar ahora</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Publicando..." : "Publicar Anuncio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
