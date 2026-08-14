"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, X, Search, Trash2, RefreshCw, FolderOpen, Download, Eye, Calendar } from "lucide-react";
import Link from "next/link";

interface Document {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

const categoryOptions = [
  "Estatutos", "Actas de Reuniones", "Financieros", "Certificados", "Contratos", "Informes", "Otros"
];

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [kpis, setKpis] = useState({ total: 0, recent: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    fileUrl: "",
    fileType: "",
    fileSize: "",
    authorId: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", ...(search && { search }), ...(categoryFilter && { category: categoryFilter }) });
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      setDocs(data.documents || []);
      setKpis(data.kpis || { total: 0, recent: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ title: "", description: "", category: "", fileUrl: "", fileType: "", fileSize: "", authorId: "" });
        fetchData();
      } else {
        alert("Error al guardar el documento");
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            Gestión Documental
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Archivos, actas, contratos y documentos importantes de la iglesia.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Subir Documento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Documentos</p>
          <h4 className="text-3xl font-bold text-blue-600">{kpis.total}</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Últimos 30 días</p>
          <h4 className="text-3xl font-bold text-green-600">{kpis.recent}</h4>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-300 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-full sm:w-48"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={fetchData} className="btn-outline text-sm px-3 py-2"><RefreshCw size={14} /> Actualizar</button>
      </div>

      {/* Lista de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Cargando...</div>
        ) : docs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No hay documentos subidos</p>
            <p className="text-sm mt-1">Sube el primer documento de la iglesia.</p>
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{doc.title}</h4>
                  <p className="text-xs text-gray-500 truncate">{doc.description || "Sin descripción"}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {doc.category && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{doc.category}</span>}
                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar size={10} /> {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-gray-400">{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={doc.fileUrl} target="_blank" className="p-1 text-gray-400 hover:text-blue-600"><Eye size={14} /></Link>
                  <Link href={doc.fileUrl} target="_blank" download className="p-1 text-gray-400 hover:text-green-600"><Download size={14} /></Link>
                  <button onClick={() => handleDelete(doc.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Subir Documento */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Subir Nuevo Documento</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-xs font-semibold text-gray-500">Título del Documento *</label><input className="input-field" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500">Descripción</label><textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500">Categoría</label><select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="">Seleccionar</option>{categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-500">URL del Archivo *</label><input className="input-field" required value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} placeholder="https://... .pdf" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500">Tipo de Archivo</label><input className="input-field" value={form.fileType} onChange={e => setForm({...form, fileType: e.target.value})} placeholder="pdf, docx, jpg..." /></div>
                  <div><label className="text-xs font-semibold text-gray-500">Tamaño (KB)</label><input type="number" className="input-field" value={form.fileSize} onChange={e => setForm({...form, fileSize: e.target.value})} /></div>
                </div>
                <button type="submit" className="btn-primary w-full">Subir Documento</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}