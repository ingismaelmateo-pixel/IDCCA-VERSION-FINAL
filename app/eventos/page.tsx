"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, X, Check, Calendar, MapPin, Users, 
  Search, Edit2, Trash2, Clock, 
  CalendarDays, UploadCloud, Trash, LayoutGrid, Table as TableIcon,
  AlertTriangle, Loader2, Eye
} from "lucide-react";
import { formatDate, formatDateShort } from "@/lib/utils";

// Definición de tipos basada en tu Schema
interface Event {
  id: number;
  title: string;
  description: string | null;
  eventType: string;
  bannerUrl: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  registeredCount: number;
  hasQrCode: boolean;
  qrCodeUrl: string | null;
  ministryId: number | null;
  organizerId: number | null;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Mapeo de Estilos y Etiquetas visuales
const eventTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  congress: { label: "Congresos", color: "text-blue-600", bgColor: "bg-blue-100 text-blue-700" },
  vigil: { label: "Vigilias", color: "text-indigo-600", bgColor: "bg-indigo-100 text-indigo-700" },
  campaign: { label: "Campañas", color: "text-orange-600", bgColor: "bg-orange-100 text-orange-700" },
  baptism: { label: "Bautismos", color: "text-cyan-600", bgColor: "bg-cyan-100 text-cyan-700" },
  conference: { label: "Conferencias", color: "text-purple-600", bgColor: "bg-purple-100 text-purple-700" },
  retreat: { label: "Retiros", color: "text-emerald-600", bgColor: "bg-emerald-100 text-emerald-700" },
  evangelism: { label: "Evangelismo", color: "text-green-600", bgColor: "bg-green-100 text-green-700" },
  service: { label: "Cultos", color: "text-gray-600", bgColor: "bg-gray-100 text-gray-700" },
  other: { label: "Otros", color: "text-pink-600", bgColor: "bg-pink-100 text-pink-700" },
};

const defaultForm = {
  title: "",
  description: "",
  eventType: "service",
  bannerUrl: "",
  startDate: "",
  endDate: "",
  location: "",
  capacity: "",
  isPublic: true,
  status: "upcoming",
};

export default function EventosPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Estado de vista
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null); // Objeto completo del evento a borrar

  const uniqueTypes = Array.from(new Set(events.map(e => e.eventType)));
  const eventTypes = ["all", ...uniqueTypes];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        search,
        ...(selectedType && selectedType !== "all" && { eventType: selectedType }),
      });
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data || []);
    } catch (e) {
      console.error("Error fetching events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, selectedType]);

  // Carga local de imágenes desde la PC (Base64)
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("❌ La imagen debe pesar menos de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, bannerUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/events?id=${editingId}` : "/api/events";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm(defaultForm);
          setEditingId(null);
          fetchEvents();
        }, 1500);
      } else {
        const data = await res.json();
        alert(`❌ Error: ${data.error || 'No se pudo guardar el evento.'}`);
      }
    } catch (error) {
      alert("❌ Error de conexión con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      const res = await fetch(`/api/events?id=${eventId}&action=register`, { method: "PATCH" });
      if (res.ok) {
        setEvents(prev => prev.map(e => 
          e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
        ));
      }
    } catch (e) {
      console.error("Error registering:", e);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      eventType: event.eventType,
      bannerUrl: event.bannerUrl || "",
      startDate: event.startDate ? event.startDate.split("T")[0] + "T" + event.startDate.split("T")[1]?.slice(0, 5) : "",
      endDate: event.endDate ? event.endDate.split("T")[0] + "T" + event.endDate.split("T")[1]?.slice(0, 5) : "",
      location: event.location || "",
      capacity: String(event.capacity || ""),
      isPublic: event.isPublic,
      status: event.status,
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert("❌ Error al eliminar el evento.");
      }
    } catch (e) {
      alert("❌ Ocurrió un error al comunicarse con el servidor.");
    } finally {
      setDeleting(false);
    }
  };

  const featuredEvent = events.find(e => e.status === "upcoming" && e.bannerUrl) || events[0];
  const regularEvents = events.filter(e => e.id !== featuredEvent?.id);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Toggle de Vistas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <CalendarDays size={24} className="text-blue-600" />
            Eventos y Actividades
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Planifica y gestiona los eventos de la iglesia
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selector Vista Tarjetas / Tabla */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <LayoutGrid size={15} /> Tarjetas
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <TableIcon size={15} /> Tabla
            </button>
          </div>

          <button
            onClick={() => { setShowModal(true); setForm(defaultForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Crear Evento
          </button>
        </div>
      </div>

      {/* Filtros de Categoría */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedType === "" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos
        </button>
        {eventTypes.filter(t => t !== "all").map((type) => {
          const config = eventTypeConfig[type] || eventTypeConfig.other;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                selectedType === type 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar evento por nombre..."
          className="input-field pl-9 bg-white border border-gray-200 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* EVENTO DESTACADO (Visible en vista Grid) */}
      {viewMode === "grid" && featuredEvent && !loading && (
        <div className="relative w-full h-[350px] rounded-2xl overflow-hidden shadow-lg group">
          {featuredEvent.bannerUrl ? (
            <img 
              src={featuredEvent.bannerUrl} 
              alt={featuredEvent.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-800 to-purple-900 flex items-center justify-center">
              <CalendarDays size={80} className="text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

          {/* Botones de acción rápida en el Destacado */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
              onClick={() => handleEdit(featuredEvent)}
              className="p-2 bg-white/80 hover:bg-white text-gray-700 hover:text-blue-600 backdrop-blur-md rounded-xl shadow-md transition-all cursor-pointer"
              title="Editar Evento"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => setDeleteTarget(featuredEvent)}
              className="p-2 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 backdrop-blur-md rounded-xl shadow-md transition-all cursor-pointer"
              title="Eliminar Evento"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end md:justify-center md:w-2/3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 w-fit ${eventTypeConfig[featuredEvent.eventType]?.bgColor || "bg-gray-200 text-gray-700"}`}>
              {eventTypeConfig[featuredEvent.eventType]?.label || "Evento"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              {featuredEvent.title}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-2 max-w-2xl">
              {featuredEvent.description || "Únete a nosotros para este evento especial."}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-200">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{formatDate(featuredEvent.startDate)}</span>
                {featuredEvent.endDate && <span> - {formatDate(featuredEvent.endDate)}</span>}
              </div>
              {featuredEvent.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  <span>{featuredEvent.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={14} />
                <span className="font-semibold text-white">{featuredEvent.registeredCount.toLocaleString()}</span> Registrados
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => handleRegister(featuredEvent.id)}
                className="bg-white text-blue-900 hover:bg-gray-100 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-colors"
              >
                Registrarme Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL: TARJETAS O TABLA */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-80">
              <div className="skeleton w-full h-40 rounded-xl mb-4" />
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <CalendarDays size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">No hay eventos programados</p>
          <p className="text-gray-300 text-sm mt-1">Crea el primer evento usando el botón de arriba</p>
        </div>
      ) : viewMode === "grid" ? (
        /* VISTA EN TARJETAS (GRID) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularEvents.map((event) => {
            const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
            return (
              <div key={event.id} className="card-premium overflow-hidden hover:shadow-xl transition-shadow group bg-white relative flex flex-col">
                
                {/* Botones Modificar / Eliminar siempre visibles en hover */}
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(event)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Evento"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    onClick={() => setDeleteTarget(event)}
                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar Evento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="relative h-48 overflow-hidden">
                  {event.bannerUrl ? (
                    <img 
                      src={event.bannerUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <CalendarDays size={40} className="text-white/60" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${config.bgColor}`}>
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                    {event.description || "Evento de la iglesia."}
                  </p>

                  <div className="space-y-2 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">
                      👥 {event.registeredCount} Registrados
                    </span>
                    <button 
                      onClick={() => handleRegister(event.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Users size={12} /> Registrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA EN TABLA */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-4 py-4">Categoría</th>
                  <th className="px-4 py-4">Fecha de Inicio</th>
                  <th className="px-4 py-4">Ubicación</th>
                  <th className="px-4 py-4">Inscriptos</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {events.map((event) => {
                  const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
                  return (
                    <tr key={event.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        {event.bannerUrl ? (
                          <img src={event.bannerUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <CalendarDays size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{event.title}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{event.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-xs">
                        {formatDate(event.startDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-xs">
                        {event.location || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs font-semibold text-gray-700">
                        {event.registeredCount} / {event.capacity || "∞"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(event)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR EVENTO */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-3xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">
                {editingId ? "Editar Evento" : "Crear Nuevo Evento"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Evento guardado exitosamente!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Título del Evento *</label>
                  <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Congreso de Jóvenes" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                  <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles del evento..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Evento</label>
                  <select className="input-field" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                    {Object.entries(eventTypeConfig).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                {/* CARGA LOCAL DE IMAGEN DESDE PC */}
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Imagen del Banner</label>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 font-medium text-xs cursor-pointer hover:bg-blue-100 transition-colors">
                      <UploadCloud size={16} />
                      <span>Seleccionar de la PC</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLocalImageUpload} 
                        className="hidden" 
                      />
                    </label>

                    {form.bannerUrl && (
                      <button 
                        type="button" 
                        onClick={() => setForm({ ...form, bannerUrl: "" })}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash size={14} /> Quitar
                      </button>
                    )}
                  </div>

                  {form.bannerUrl && (
                    <div className="relative mt-2 h-24 w-full rounded-xl overflow-hidden border border-gray-200">
                      <img src={form.bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <input className="input-field text-sm" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="O pega una URL: https://..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha y Hora de Inicio *</label>
                  <input type="datetime-local" className="input-field" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha y Hora de Fin</label>
                  <input type="datetime-local" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ubicación / Lugar</label>
                  <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Salón Principal..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Capacidad Máxima</label>
                  <input type="number" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Ej: 200" />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
                  <label htmlFor="isPublic" className="text-sm text-gray-600">Evento Público</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : editingId ? "Actualizar Evento" : "Crear Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENTANA INTERACTIVA DE CONFIRMACIÓN DE BORRADO */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-100 transform transition-all scale-100">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Confirmar Eliminación?</h3>
            
            <p className="text-sm text-gray-500 mb-4">
              Estás a punto de borrar el evento:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 font-semibold text-gray-800 text-sm">
              "{deleteTarget.title}"
            </div>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors w-full"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-md transition-colors w-full flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}