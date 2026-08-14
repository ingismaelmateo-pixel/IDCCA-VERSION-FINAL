"use client";

import { useEffect, useState } from "react";
import { Heart, Plus, X, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PrayerRequest {
  id: number;
  requesterName: string;
  request: string;
  category: string;
  status: string;
  isPrivate: boolean;
  requestDate: string;
  response: string;
  testimony: string;
}

const statusColors: Record<string, string> = {
  pending: "badge-warning",
  in_progress: "badge-info",
  answered: "badge-success",
  closed: "badge-gold",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  answered: "Respondida",
  closed: "Cerrada",
};

const samplePrayers = [
  { name: "María González", request: "Sanidad para mi esposo que está en el hospital con una enfermedad grave.", category: "Sanidad", status: "pending", date: "10 Nov 2024", isPrivate: false },
  { name: "Carlos Méndez", request: "Restauración de mi familia y paz en el hogar.", category: "Familia", status: "in_progress", date: "08 Nov 2024", isPrivate: false },
  { name: "Ana Jiménez", request: "Trabajo urgente, llevamos 3 meses sin empleo.", category: "Provisión", status: "answered", date: "01 Nov 2024", isPrivate: false },
  { name: "Roberto Peña", request: "Salvación de mis hijos que se alejaron del camino.", category: "Salvación", status: "pending", date: "09 Nov 2024", isPrivate: true },
  { name: "Laura Torres", request: "Guía divina para una decisión importante en mi vida.", category: "Dirección", status: "in_progress", date: "07 Nov 2024", isPrivate: false },
  { name: "Pedro Ramírez", request: "Testimonio de sanidad - ¡Fui sano milagrosamente!", category: "Testimonio", status: "answered", date: "05 Nov 2024", isPrivate: false },
];

export default function Prayer() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    requesterName: "", request: "", category: "", isPrivate: false, requestDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetch("/api/prayer")
      .then((r) => r.json())
      .then((d) => { setPrayers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newPrayer = await res.json();
        setPrayers((prev) => [newPrayer, ...prev]);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm({ requesterName: "", request: "", category: "", isPrivate: false, requestDate: new Date().toISOString().split("T")[0] });
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const display = prayers.length > 0 ? prayers : samplePrayers;
  const filtered = filter ? display.filter((p) => {
    const status = prayers.length > 0 ? (p as PrayerRequest).status : (p as typeof samplePrayers[0]).status;
    return status === filter;
  }) : display;

  const counts = {
    pending: display.filter((p) => (prayers.length > 0 ? (p as PrayerRequest).status : (p as typeof samplePrayers[0]).status) === "pending").length,
    in_progress: display.filter((p) => (prayers.length > 0 ? (p as PrayerRequest).status : (p as typeof samplePrayers[0]).status) === "in_progress").length,
    answered: display.filter((p) => (prayers.length > 0 ? (p as PrayerRequest).status : (p as typeof samplePrayers[0]).status) === "answered").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Gestión de Oraciones</h2>
          <p className="text-gray-400 text-sm mt-0.5">Solicitudes de oración y seguimiento pastoral</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Nueva Solicitud
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-premium p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pendientes</p>
        </div>
        <div className="card-premium p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{counts.in_progress}</p>
          <p className="text-xs text-gray-400 mt-0.5">En Proceso</p>
        </div>
        <div className="card-premium p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{counts.answered}</p>
          <p className="text-xs text-gray-400 mt-0.5">Respondidas</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: "Todas" },
          { value: "pending", label: "Pendientes" },
          { value: "in_progress", label: "En Proceso" },
          { value: "answered", label: "Respondidas" },
          { value: "closed", label: "Cerradas" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.value
                ? "bg-blue-900 text-white shadow-md"
                : "bg-white text-gray-500 border border-gray-200 hover:border-blue-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prayer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-premium p-5">
              <div className="skeleton h-4 w-1/3 mb-3" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))
        ) : filtered.map((prayer, i) => {
          const isDemo = prayers.length === 0;
          const name = isDemo ? (prayer as typeof samplePrayers[0]).name : (prayer as PrayerRequest).requesterName;
          const request = isDemo ? (prayer as typeof samplePrayers[0]).request : (prayer as PrayerRequest).request;
          const category = isDemo ? (prayer as typeof samplePrayers[0]).category : (prayer as PrayerRequest).category;
          const status = isDemo ? (prayer as typeof samplePrayers[0]).status : (prayer as PrayerRequest).status;
          const date = isDemo ? (prayer as typeof samplePrayers[0]).date : formatDate((prayer as PrayerRequest).requestDate);
          const isPrivate = isDemo ? (prayer as typeof samplePrayers[0]).isPrivate : (prayer as PrayerRequest).isPrivate;

          return (
            <div key={i} className="card-premium p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="icon-wrap icon-wrap-danger w-9 h-9">
                    <Heart size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">{date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isPrivate && (
                    <span className="badge badge-gold text-xs">Privado</span>
                  )}
                  <span className={`badge ${statusColors[status]}`}>
                    {statusLabels[status] || status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{request}</p>
              <div className="flex items-center justify-between">
                <span className="badge badge-info text-xs">{category}</span>
                <div className="flex gap-1.5">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Seguimiento</button>
                  <span className="text-gray-300">·</span>
                  <button className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Marcar respondida</button>
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
              <h3 className="font-bold text-lg text-blue-900">Nueva Solicitud de Oración</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Solicitud registrada!</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del Solicitante</label>
                <input className="input-field" value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Seleccionar categoría</option>
                  <option value="Sanidad">Sanidad</option>
                  <option value="Familia">Familia</option>
                  <option value="Provisión">Provisión</option>
                  <option value="Salvación">Salvación</option>
                  <option value="Dirección">Dirección</option>
                  <option value="Trabajo">Trabajo</option>
                  <option value="Testimonio">Testimonio</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Petición de Oración *</label>
                <textarea className="input-field resize-none" required rows={4} value={form.request} onChange={(e) => setForm({ ...form, request: e.target.value })} placeholder="Describe la petición de oración..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                <input type="date" className="input-field" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrivate" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} className="w-4 h-4 rounded accent-blue-900" />
                <label htmlFor="isPrivate" className="text-sm text-gray-600">Solicitud privada (solo visible para pastores)</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Registrar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
