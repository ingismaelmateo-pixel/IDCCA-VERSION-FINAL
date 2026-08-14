"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, X, Check, MapPin, Users, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChurchEvent {
  id: number;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: string;
  isPublic: boolean;
}

const eventTypeLabels: Record<string, string> = {
  congress: "Congreso", vigil: "Vigilia", campaign: "Campaña",
  baptism: "Bautismo", conference: "Conferencia", retreat: "Retiro",
  evangelism: "Evangelismo", service: "Servicio", other: "Otro",
};

const eventTypeBadges: Record<string, string> = {
  congress: "badge-info", vigil: "badge-warning", campaign: "badge-success",
  baptism: "badge-gold", conference: "badge-info", retreat: "badge-success",
  service: "badge-info", other: "badge-gold",
};

const eventTypeEmojis: Record<string, string> = {
  congress: "🏛️", vigil: "🌙", campaign: "📢", baptism: "💧",
  conference: "🎤", retreat: "🏕️", service: "⛪", evangelism: "✝️", other: "📅",
};

const statusColors: Record<string, string> = {
  upcoming: "badge-info",
  ongoing: "badge-success",
  completed: "badge-gold",
  cancelled: "badge-danger",
};

const sampleEvents = [
  { title: "Vigilia de Oración", type: "vigil", date: "Vie 15 Nov 2024, 10:00 PM", location: "Templo Principal", capacity: 300, registered: 145, status: "upcoming" },
  { title: "Retiro de Jóvenes", type: "retreat", date: "16-17 Nov 2024", location: "Casa de Retiros El Monte", capacity: 80, registered: 72, status: "upcoming" },
  { title: "Congreso de Familias", type: "congress", date: "23-24 Nov 2024", location: "Auditorio Central", capacity: 500, registered: 320, status: "upcoming" },
  { title: "Bautismo General", type: "baptism", date: "Dom 01 Dic 2024, 3:00 PM", location: "Piscina Bautismal", capacity: 50, registered: 28, status: "upcoming" },
  { title: "Conferencia de Liderazgo", type: "conference", date: "07-08 Dic 2024", location: "Sala de Conferencias", capacity: 200, registered: 180, status: "upcoming" },
  { title: "Campaña de Evangelismo", type: "campaign", date: "14-15 Dic 2024", location: "Parque Central", capacity: 1000, registered: 420, status: "upcoming" },
];

export default function Events() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [form, setForm] = useState({
    title: "", description: "", eventType: "service", startDate: "",
    endDate: "", location: "", capacity: "", status: "upcoming", isPublic: true,
  });

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents((prev) => [newEvent, ...prev]);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm({ title: "", description: "", eventType: "service", startDate: "", endDate: "", location: "", capacity: "", status: "upcoming", isPublic: true });
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const displayEvents = events.length > 0 ? events : sampleEvents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Eventos</h2>
          <p className="text-gray-400 text-sm mt-0.5">{displayEvents.length} eventos registrados</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView("grid")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "grid" ? "bg-white shadow text-blue-900" : "text-gray-500"}`}>
              Cuadrícula
            </button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "list" ? "bg-white shadow text-blue-900" : "text-gray-500"}`}>
              Lista
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Nuevo Evento
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(events.length === 0 ? sampleEvents : events).map((event, i) => {
            const isDemo = events.length === 0;
            const title = isDemo ? (event as typeof sampleEvents[0]).title : (event as ChurchEvent).title;
            const type = isDemo ? (event as typeof sampleEvents[0]).type : (event as ChurchEvent).eventType;
            const dateStr = isDemo ? (event as typeof sampleEvents[0]).date : formatDate((event as ChurchEvent).startDate);
            const location = isDemo ? (event as typeof sampleEvents[0]).location : (event as ChurchEvent).location;
            const capacity = isDemo ? (event as typeof sampleEvents[0]).capacity : (event as ChurchEvent).capacity;
            const registered = isDemo ? (event as typeof sampleEvents[0]).registered : (event as ChurchEvent).registeredCount;
            const status = isDemo ? (event as typeof sampleEvents[0]).status : (event as ChurchEvent).status;
            const pct = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;

            return (
              <div key={i} className="card-premium overflow-hidden cursor-pointer group">
                <div className="h-20 gradient-primary flex items-center justify-center text-4xl relative overflow-hidden">
                  <span>{eventTypeEmojis[type] || "📅"}</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight flex-1">{title}</h3>
                    <span className={`badge ${eventTypeBadges[type]} ml-2 whitespace-nowrap`}>
                      {eventTypeLabels[type] || type}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={11} /> {dateStr}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={11} /> {location}
                    </div>
                    {capacity > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users size={11} /> {registered}/{capacity} registrados
                      </div>
                    )}
                  </div>
                  {capacity > 0 && (
                    <div>
                      <div className="progress-bar mb-1">
                        <div
                          className={`progress-fill ${pct >= 80 ? "progress-fill-gold" : ""}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{pct}% lleno</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`badge ${statusColors[status]}`}>
                      {status === "upcoming" ? "Próximo" : status === "ongoing" ? "En curso" : status === "completed" ? "Completado" : status}
                    </span>
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Ver detalles →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Capacidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(events.length === 0 ? sampleEvents : events).map((event, i) => {
                const isDemo = events.length === 0;
                const title = isDemo ? (event as typeof sampleEvents[0]).title : (event as ChurchEvent).title;
                const type = isDemo ? (event as typeof sampleEvents[0]).type : (event as ChurchEvent).eventType;
                const dateStr = isDemo ? (event as typeof sampleEvents[0]).date : formatDate((event as ChurchEvent).startDate);
                const location = isDemo ? (event as typeof sampleEvents[0]).location : (event as ChurchEvent).location;
                const capacity = isDemo ? (event as typeof sampleEvents[0]).capacity : (event as ChurchEvent).capacity;
                const registered = isDemo ? (event as typeof sampleEvents[0]).registered : (event as ChurchEvent).registeredCount;
                const status = isDemo ? (event as typeof sampleEvents[0]).status : (event as ChurchEvent).status;
                return (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{eventTypeEmojis[type] || "📅"}</span>
                        <span className="font-medium text-sm">{title}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${eventTypeBadges[type]}`}>{eventTypeLabels[type] || type}</span></td>
                    <td><span className="text-sm text-gray-600">{dateStr}</span></td>
                    <td><span className="text-sm text-gray-600">{location}</span></td>
                    <td><span className="text-sm text-gray-600">{registered}/{capacity}</span></td>
                    <td><span className={`badge ${statusColors[status]}`}>{status === "upcoming" ? "Próximo" : status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">Nuevo Evento</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Evento creado exitosamente!</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Título del Evento *</label>
                <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre del evento" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Evento</label>
                  <select className="input-field" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                    {Object.entries(eventTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                  <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Próximo</option>
                    <option value="ongoing">En curso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Inicio *</label>
                  <input type="datetime-local" className="input-field" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Fin</label>
                  <input type="datetime-local" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lugar</label>
                <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Dirección o nombre del lugar" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Capacidad</label>
                <input type="number" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Número máximo de personas" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del evento..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Crear Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
