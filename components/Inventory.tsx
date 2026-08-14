"use client";

import { useEffect, useState } from "react";
import { Package, Plus, X, Check, Search } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  quantity: number;
  location: string;
  condition: string;
  purchaseDate: string;
  purchasePrice: string;
  notes: string;
}

const categoryLabels: Record<string, string> = {
  instrument: "Instrumento", sound_equipment: "Equipo de Sonido",
  microphone: "Micrófono", projector: "Proyector", computer: "Computadora",
  furniture: "Mobiliario", bible: "Biblia", book: "Libro",
  vehicle: "Vehículo", other: "Otro",
};

const categoryEmojis: Record<string, string> = {
  instrument: "🎸", sound_equipment: "🔊", microphone: "🎤",
  projector: "📽️", computer: "💻", furniture: "🪑",
  bible: "📖", book: "📚", vehicle: "🚐", other: "📦",
};

const conditionColors: Record<string, string> = {
  excellent: "badge-success", good: "badge-info",
  fair: "badge-warning", poor: "badge-danger",
};

const conditionLabels: Record<string, string> = {
  excellent: "Excelente", good: "Bueno", fair: "Regular", poor: "Malo",
};

const sampleInventory = [
  { name: "Piano de Cola Yamaha", category: "instrument", brand: "Yamaha", model: "C3", serial: "YA2024-001", qty: 1, location: "Santuario Principal", condition: "excellent", price: 250000 },
  { name: "Mezcladora Allen & Heath", category: "sound_equipment", brand: "Allen & Heath", model: "SQ-5", serial: "AH2023-045", qty: 1, location: "Cabina de Sonido", condition: "good", price: 180000 },
  { name: "Micrófono Shure SM58", category: "microphone", brand: "Shure", model: "SM58", serial: "SH2022-112", qty: 8, location: "Cabina de Sonido", condition: "good", price: 8500 },
  { name: "Proyector Epson 4K", category: "projector", brand: "Epson", model: "EB-PQ2216B", serial: "EP2024-003", qty: 2, location: "Santuario Principal", condition: "excellent", price: 95000 },
  { name: "Computadora iMac", category: "computer", brand: "Apple", model: "iMac 2023", serial: "AP2023-067", qty: 3, location: "Oficina Pastoral", condition: "excellent", price: 120000 },
  { name: "Sillas Plegables", category: "furniture", brand: "Nacional", model: "S-200", serial: "—", qty: 250, location: "Almacén", condition: "good", price: 850 },
  { name: "Biblias RVR60", category: "bible", brand: "Sociedades Bíblicas", model: "RVR60 Letra Grande", serial: "—", qty: 150, location: "Recepción", condition: "good", price: 450 },
  { name: "Van Toyota Hiace", category: "vehicle", brand: "Toyota", model: "Hiace 2020", serial: "VIN2020-ABC123", qty: 1, location: "Estacionamiento", condition: "good", price: 1200000 },
];

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "other", brand: "", model: "", serialNumber: "",
    quantity: "1", location: "", condition: "good", purchaseDate: "",
    purchasePrice: "", notes: "",
  });

  useEffect(() => {
    const params = new URLSearchParams({ ...(search && { search }), ...(categoryFilter && { category: categoryFilter }) });
    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [newItem, ...prev]);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm({ name: "", category: "other", brand: "", model: "", serialNumber: "", quantity: "1", location: "", condition: "good", purchaseDate: "", purchasePrice: "", notes: "" });
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const display = items.length > 0 ? items : sampleInventory;
  const totalValue = sampleInventory.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Control de Inventario</h2>
          <p className="text-gray-400 text-sm mt-0.5">Activos e inventario de la iglesia</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Agregar Ítem
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-premium p-4 text-center">
          <p className="text-2xl font-bold text-blue-900">{sampleInventory.length}</p>
          <p className="text-xs text-gray-400">Tipos de Activos</p>
        </div>
        <div className="card-premium p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{sampleInventory.reduce((a, i) => a + i.qty, 0)}</p>
          <p className="text-xs text-gray-400">Unidades Totales</p>
        </div>
        <div className="card-premium p-4 text-center">
          <p className="text-lg font-bold text-yellow-600">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-gray-400">Valor Total</p>
        </div>
        <div className="card-premium p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">6</p>
          <p className="text-xs text-gray-400">Categorías</p>
        </div>
      </div>

      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar ítem..." className="input-field pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-48" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Ítem</th>
              <th>Categoría</th>
              <th>Marca / Modelo</th>
              <th>No. Serie</th>
              <th>Cantidad</th>
              <th>Ubicación</th>
              <th>Condición</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : (items.length === 0 ? sampleInventory : items).map((item, i) => {
              const isDemo = items.length === 0;
              const name = isDemo ? (item as typeof sampleInventory[0]).name : (item as InventoryItem).name;
              const category = isDemo ? (item as typeof sampleInventory[0]).category : (item as InventoryItem).category;
              const brand = isDemo ? (item as typeof sampleInventory[0]).brand : (item as InventoryItem).brand;
              const model = isDemo ? (item as typeof sampleInventory[0]).model : (item as InventoryItem).model;
              const serial = isDemo ? (item as typeof sampleInventory[0]).serial : (item as InventoryItem).serialNumber;
              const qty = isDemo ? (item as typeof sampleInventory[0]).qty : (item as InventoryItem).quantity;
              const location = isDemo ? (item as typeof sampleInventory[0]).location : (item as InventoryItem).location;
              const condition = isDemo ? (item as typeof sampleInventory[0]).condition : (item as InventoryItem).condition;
              const price = isDemo ? (item as typeof sampleInventory[0]).price : Number((item as InventoryItem).purchasePrice);

              return (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{categoryEmojis[category] || "📦"}</span>
                      <span className="font-medium text-sm">{name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{categoryLabels[category] || category}</span></td>
                  <td><span className="text-xs text-gray-600">{brand} {model}</span></td>
                  <td><span className="text-xs font-mono text-gray-500">{serial}</span></td>
                  <td><span className="font-semibold text-sm text-gray-700">{qty}</span></td>
                  <td><span className="text-xs text-gray-600">{location}</span></td>
                  <td><span className={`badge ${conditionColors[condition]}`}>{conditionLabels[condition] || condition}</span></td>
                  <td><span className="text-sm font-semibold text-gray-700">{formatCurrency(price)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">Nuevo Ítem de Inventario</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Ítem registrado!</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre *</label>
                <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del ítem" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría *</label>
                  <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Condición</label>
                  <select className="input-field" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                    <option value="excellent">Excelente</option>
                    <option value="good">Bueno</option>
                    <option value="fair">Regular</option>
                    <option value="poor">Malo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Marca</label>
                  <input className="input-field" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Marca" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Modelo</label>
                  <input className="input-field" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Modelo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">No. de Serie</label>
                  <input className="input-field" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="Número de serie" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad</label>
                  <input type="number" min="1" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ubicación</label>
                  <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Dónde se encuentra" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Precio (RD$)</label>
                  <input type="number" className="input-field" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
                <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones adicionales..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Registrar Ítem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
