"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Box, Plus, X, Check, Edit2, Trash2, 
  Search, RefreshCw, Download, 
  Package, Tag, DollarSign, AlertCircle, 
  MapPin, Shield, Calendar,
  Settings, Monitor, Truck, Mic, BookOpen,
  Minus, Plus as PlusIcon, TrendingUp
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Interfaces
interface InventoryItem {
  id: number;
  name: string;
  category: string;
  description: string | null;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  quantity: number;
  location: string | null;
  responsibleId: number | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  condition: string;
  qrCodeUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configuración de categorías para interfaz
const categoryLabels: Record<string, { label: string; icon: React.ElementType; color: string; ringColor: string }> = {
  instrument: { label: "Instrumentos", icon: Mic, color: "text-purple-600 bg-purple-50", ringColor: "ring-purple-200" },
  sound_equipment: { label: "Equipo de Sonido", icon: Settings, color: "text-blue-600 bg-blue-50", ringColor: "ring-blue-200" },
  microphone: { label: "Micrófonos", icon: Mic, color: "text-indigo-600 bg-indigo-50", ringColor: "ring-indigo-200" },
  projector: { label: "Proyectores", icon: Monitor, color: "text-cyan-600 bg-cyan-50", ringColor: "ring-cyan-200" },
  computer: { label: "Computadoras", icon: Monitor, color: "text-gray-600 bg-gray-50", ringColor: "ring-gray-200" },
  furniture: { label: "Muebles", icon: Package, color: "text-amber-600 bg-amber-50", ringColor: "ring-amber-200" },
  bible: { label: "Biblias", icon: BookOpen, color: "text-green-600 bg-green-50", ringColor: "ring-green-200" },
  book: { label: "Libros", icon: BookOpen, color: "text-emerald-600 bg-emerald-50", ringColor: "ring-emerald-200" },
  vehicle: { label: "Vehículos", icon: Truck, color: "text-orange-600 bg-orange-50", ringColor: "ring-orange-200" },
  other: { label: "Otros", icon: Box, color: "text-pink-600 bg-pink-50", ringColor: "ring-pink-200" },
};

// Configuración de condición / estado (Colores mejorados tipo "Pill")
const conditionLabels: Record<string, string> = {
  good: "Buen Estado",
  regular: "Regular",
  damaged: "Dañado",
};

const conditionColors: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-700 border-emerald-200",
  regular: "bg-amber-100 text-amber-700 border-amber-200",
  damaged: "bg-red-100 text-red-700 border-red-200",
};

const defaultForm = {
  name: "",
  category: "other",
  description: "",
  serialNumber: "",
  brand: "",
  model: "",
  quantity: 1,
  location: "",
  responsibleId: "",
  purchaseDate: "",
  purchasePrice: "",
  condition: "good",
  qrCodeUrl: "",
  notes: "",
  isActive: true,
};

export default function InventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [kpis, setKpis] = useState({ totalValue: 0, totalItems: 0, categoryCounts: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        ...(categoryFilter && { category: categoryFilter }),
        ...(conditionFilter && { condition: conditionFilter }),
      });
      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setKpis(data.kpis || { totalValue: 0, totalItems: 0, categoryCounts: [] });
    } catch (e) {
      console.error("Error fetching inventory:", e);
      showToast("Error al cargar el inventario", "error");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, conditionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // EXPORT TO CSV
  // ============================================================
  const handleExportCSV = () => {
    if (items.length === 0) {
      showToast("No hay elementos para exportar", "error");
      return;
    }

    const headers = ["ID", "Nombre", "Categoría", "Estado", "Marca", "Modelo", "Serie", "Cantidad", "Ubicación", "Precio Compra ($)", "Fecha Compra"];
    const rows = items.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      categoryLabels[i.category]?.label || i.category,
      conditionLabels[i.condition] || i.condition,
      `"${(i.brand || '').replace(/"/g, '""')}"`,
      `"${(i.model || '').replace(/"/g, '""')}"`,
      `"${(i.serialNumber || '').replace(/"/g, '""')}"`,
      i.quantity,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      i.purchasePrice ? parseFloat(i.purchasePrice).toFixed(2) : "0.00",
      i.purchaseDate ? i.purchaseDate.split("T")[0] : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("📥 Inventario exportado exitosamente", "success");
  };

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/inventory?id=${editingId}` : "/api/inventory";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Ítem ${editingId ? 'actualizado' : 'creado'} exitosamente`, 'success');
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

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || "",
      serialNumber: item.serialNumber || "",
      brand: item.brand || "",
      model: item.model || "",
      quantity: item.quantity,
      location: item.location || "",
      responsibleId: item.responsibleId ? String(item.responsibleId) : "",
      purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
      purchasePrice: item.purchasePrice || "",
      condition: item.condition || "good",
      qrCodeUrl: item.qrCodeUrl || "",
      notes: item.notes || "",
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/inventory?id=${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Ítem eliminado correctamente", 'success');
        fetchData();
      } else {
        showToast("❌ Error al eliminar el ítem", 'error');
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
      
      {/* NOTIFICACIÓN TOAST */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="text-green-500 shrink-0" /> : <AlertCircle size={20} className="text-red-500 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* HEADER DE PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Box size={24} className="text-blue-600" />
            Inventario de Recursos
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Controla y gestiona los activos de la iglesia
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar
          </button>
          <button
            onClick={() => { setShowModal(true); setEditingId(null); setForm(defaultForm); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo Ítem
          </button>
        </div>
      </div>

      {/* TARJETAS DE KPIS - MEJORADAS CON GLASSMORPHISM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Ítems */}
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Total Ítems</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.totalItems}</h4>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50/80 backdrop-blur-sm px-2 py-1 rounded-full w-fit border border-emerald-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Actualizado
                </div>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 text-white ring-4 ring-white/20">
                <Package size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Valor Total */}
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider">Valor Total ($)</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                  {loading ? "..." : `$${kpis.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </h4>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50/80 backdrop-blur-sm px-2 py-1 rounded-full w-fit border border-blue-200/50">
                  <TrendingUp size={12} />
                  Activos totales
                </div>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/25 text-white ring-4 ring-white/20">
                <DollarSign size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Categorías Usadas */}
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-800/60 uppercase tracking-wider">Categorías</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.categoryCounts.length}</h4>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-purple-600 bg-purple-50/80 backdrop-blur-sm px-2 py-1 rounded-full w-fit border border-purple-200/50">
                  <Tag size={12} />
                  Distribución
                </div>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/25 text-white ring-4 ring-white/20">
                <Tag size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: En Buen Estado */}
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-800/60 uppercase tracking-wider">En Buen Estado</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                  {loading ? "..." : items.filter(i => i.condition === 'good').length}
                </h4>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-600 bg-rose-50/80 backdrop-blur-sm px-2 py-1 rounded-full w-fit border border-rose-200/50">
                  <Shield size={12} />
                  En Stock
                </div>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-500/25 text-white ring-4 ring-white/20">
                <Shield size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="card-premium p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              className="input-field pl-9 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full sm:w-48 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            className="input-field w-full sm:w-36 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="good">Bueno</option>
            <option value="regular">Regular</option>
            <option value="damaged">Dañado</option>
          </select>
          <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center justify-center gap-1 py-2 px-3">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* GRID DE INVENTARIO */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-64 animate-pulse bg-white/80">
              <div className="w-full h-24 bg-gray-200 rounded-xl mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-premium p-12 text-center bg-white/80 backdrop-blur-sm">
          <Box size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron ítems en el inventario</p>
          <p className="text-gray-400 text-sm mt-1">Registra tu primer recurso haciendo clic en "Nuevo Ítem"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const catConfig = categoryLabels[item.category] || categoryLabels.other;
            const CatIcon = catConfig.icon;
            const conditionColor = conditionColors[item.condition] || "bg-gray-100 text-gray-600 border-gray-200";
            const conditionLabel = conditionLabels[item.condition] || item.condition;

            return (
              <div key={item.id} className="card-premium p-4 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group relative flex flex-col justify-between ring-1 ring-gray-50/50">
                
                {/* Botones Flotantes de Acción */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <button onClick={() => handleEdit(item)} title="Editar" className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(item.id)} title="Eliminar" className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  {/* Header Tarjeta */}
                  <div className="flex items-start gap-3 mb-3 pr-12">
                    <div className={`p-2.5 rounded-xl shrink-0 ring-1 ${catConfig.ringColor} ${catConfig.color}`}>
                      <CatIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{item.brand || item.model ? `${item.brand || ''} ${item.model || ''}` : "Sin marca"}</p>
                    </div>
                  </div>

                  {/* Detalle Central */}
                  <div className="space-y-1.5 mb-4 text-xs">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Cantidad:</span>
                      <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-full">{item.quantity} ud(s)</span>
                    </div>

                    {item.location && (
                      <div className="flex items-center gap-1.5 text-gray-500 truncate">
                        <MapPin size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}

                    {item.purchasePrice && (
                      <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                        <DollarSign size={13} className="shrink-0" />
                        <span>${parseFloat(item.purchasePrice).toLocaleString()}</span>
                      </div>
                    )}

                    {item.purchaseDate && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <Calendar size={13} className="shrink-0" />
                        <span>Comprado: {formatDate(item.purchaseDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Tarjeta */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[11px] rounded-full border font-medium shadow-sm ${conditionColor}`}>
                    {conditionLabel}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow-sm ${catConfig.color}`}>
                    {catConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar Ítem" : "Nuevo Ítem de Inventario"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Nombre del Ítem *</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="ej. Guitarra Acústica, Consola de Audio..." />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Descripción</label>
                    <textarea className="input-field mt-1 resize-none bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Detalles o especificaciones adicionales..." />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Categoría</label>
                    <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                      {Object.entries(categoryLabels).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Estado / Condición</label>
                    <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.condition} onChange={(e) => setForm({...form, condition: e.target.value})}>
                      <option value="good">Bueno</option>
                      <option value="regular">Regular</option>
                      <option value="damaged">Dañado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Marca</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} placeholder="ej. Yamaha, Behringer" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Modelo</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} placeholder="ej. FG800, X32" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">N° de Serie</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.serialNumber} onChange={(e) => setForm({...form, serialNumber: e.target.value})} placeholder="SN-123456" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Cantidad</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button type="button" onClick={() => setForm({...form, quantity: Math.max(1, form.quantity - 1)})} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"><Minus size={14} /></button>
                      <input type="number" className="input-field w-20 text-center bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" min="1" value={form.quantity} onChange={(e) => setForm({...form, quantity: Math.max(1, parseInt(e.target.value) || 1)})} />
                      <button type="button" onClick={() => setForm({...form, quantity: form.quantity + 1})} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"><PlusIcon size={14} /></button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Ubicación</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="ej. Temple Principal, Almacén" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Fecha de Compra</label>
                    <input type="date" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.purchaseDate} onChange={(e) => setForm({...form, purchaseDate: e.target.value})} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Precio de Compra ($)</label>
                    <input type="number" step="0.01" min="0" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.purchasePrice} onChange={(e) => setForm({...form, purchasePrice: e.target.value})} placeholder="0.00" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">URL del Código QR</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.qrCodeUrl} onChange={(e) => setForm({...form, qrCodeUrl: e.target.value})} placeholder="https://..." />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Notas Internas</label>
                    <textarea className="input-field mt-1 resize-none bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Observaciones sobre mantenimiento o garantía..." />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving ? "Guardando..." : editingId ? "Actualizar Ítem" : "Crear Ítem"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR (Mejorado visualmente) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Ítem</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este activo?</p>
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