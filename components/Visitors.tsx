"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserPlus, Plus, X, Check, Phone, Mail, 
  Users, Search, Filter, Download, Upload,
  Edit2, Trash2, Eye, MapPin, Calendar,
  ChevronLeft, ChevronRight, Camera,
  TrendingUp, UserCheck, UserX, Clock,
  Award, Heart, MessageSquare, BookOpen,
  AlertCircle
} from "lucide-react";
import { formatDate, getInitials, formatDateShort } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Visitor {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  address: string;
  phone: string;
  cellPhone: string;
  email: string;
  documentId: string;
  firstVisitDate: string;
  lastVisitDate: string;
  visitCount: number;
  status: string;
  origin: string;
  interests: string;
  decision: string;
  converted: boolean;
  conversionDate: string;
  baptismPending: boolean;
  baptismDate: string;
  followedBy: string;
  followUpNotes: string;
  observations: string;
  privateNotes: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface VisitorFormData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  address: string;
  phone: string;
  cellPhone: string;
  email: string;
  documentId: string;
  firstVisitDate: string;
  lastVisitDate: string;
  status: string;
  origin: string;
  interests: string;
  decision: string;
  converted: boolean;
  conversionDate: string;
  baptismPending: boolean;
  baptismDate: string;
  followedBy: string;
  followUpNotes: string;
  observations: string;
  privateNotes: string;
  photoUrl: string;
  photoFile?: File;
}

const statusColors: Record<string, string> = {
  new: "badge-info",
  contacted: "badge-warning",
  following: "badge-purple",
  regular: "badge-success",
  converted: "badge-gold",
  baptized: "badge-primary",
};

const statusLabels: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  following: "En Seguimiento",
  regular: "Regular",
  converted: "Convertido",
  baptized: "Bautizado",
};

const statusIcons: Record<string, any> = {
  new: UserPlus,
  contacted: Phone,
  following: MessageSquare,
  regular: Users,
  converted: Heart,
  baptized: Award,
};

const originLabels: Record<string, string> = {
  friend: "Amigo/Familiar",
  social_media: "Redes Sociales",
  event: "Evento Especial",
  door_to_door: "Visita a Hogar",
  online: "Servicio Online",
  other: "Otro",
};

const genderLabels: Record<string, string> = {
  male: "Masculino",
  female: "Femenino",
};

const defaultForm: VisitorFormData = {
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  address: "",
  phone: "",
  cellPhone: "",
  email: "",
  documentId: "",
  firstVisitDate: new Date().toISOString().split("T")[0],
  lastVisitDate: "",
  status: "new",
  origin: "",
  interests: "",
  decision: "",
  converted: false,
  conversionDate: "",
  baptismPending: false,
  baptismDate: "",
  followedBy: "",
  followUpNotes: "",
  observations: "",
  privateNotes: "",
  photoUrl: "",
};

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Visitor | null>(null);
  const [form, setForm] = useState<VisitorFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // 🔥 NUEVOS ESTADOS
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        search,
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/visitors?${params}`);
      const data = await res.json();
      setVisitors(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, photoUrl: reader.result as string, photoFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/visitors/${editingId}` : "/api/visitors";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm(defaultForm);
          setEditingId(null);
          setPage(1);
          fetchVisitors();
        }, 1000);
      } else {
        console.error("Error del servidor:", data);
        showToast(`❌ Error: ${data.error || 'No se pudo guardar el visitante.'}`, 'error');
        setSaving(false);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      showToast("❌ Error de conexión con el servidor.", 'error');
      setSaving(false);
    }
  };

  const handleEdit = (visitor: Visitor) => {
    setEditingId(visitor.id);
    setForm({
      firstName: visitor.firstName || "",
      lastName: visitor.lastName || "",
      gender: visitor.gender || "",
      birthDate: visitor.birthDate || "",
      address: visitor.address || "",
      phone: visitor.phone || "",
      cellPhone: visitor.cellPhone || "",
      email: visitor.email || "",
      documentId: visitor.documentId || "",
      firstVisitDate: visitor.firstVisitDate || "",
      lastVisitDate: visitor.lastVisitDate || "",
      status: visitor.status || "new",
      origin: visitor.origin || "",
      interests: visitor.interests || "",
      decision: visitor.decision || "",
      converted: visitor.converted || false,
      conversionDate: visitor.conversionDate || "",
      baptismPending: visitor.baptismPending || false,
      baptismDate: visitor.baptismDate || "",
      followedBy: visitor.followedBy || "",
      followUpNotes: visitor.followUpNotes || "",
      observations: visitor.observations || "",
      privateNotes: visitor.privateNotes || "",
      photoUrl: visitor.photoUrl || "",
    });
    setShowModal(true);
  };

  // 🔥 NUEVO MANEJO DE ELIMINACIÓN
  const handleConfirmDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/visitors/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        showToast("🗑️ Visitante eliminado correctamente", 'success');
        fetchVisitors();
      } else {
        showToast("❌ Error al eliminar el visitante", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", 'error');
    }
  };

  // 📄 NUEVA FUNCIÓN: EXPORTAR PDF
  const handleExportPDF = () => {
    if (visitors.length === 0) {
      showToast("ℹ️ No hay visitantes para exportar.", 'error');
      return;
    }

    const doc = new jsPDF();
    const title = `Lista de Visitantes - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total: ${visitors.length} visitantes`, 14, 28);

    const tableData = visitors.map((v) => [
      `${v.firstName} ${v.lastName}`,
      v.cellPhone || "—",
      v.email || "—",
      statusLabels[v.status] || v.status,
      originLabels[v.origin] || v.origin || "—",
      formatDateShort(v.firstVisitDate),
      v.converted ? "✓" : "—"
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Nombre", "Teléfono", "Email", "Estado", "Origen", "1ra Visita", "Convertido"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
      didParseCell: (data) => {
        if (data.section === 'head') return;
        if (data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    doc.save(`visitantes_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("✅ Reporte de visitantes exportado exitosamente", "success");
  };

  // Calcular KPIs
  const totalVisitors = total;
  const convertedCount = visitors.filter(v => v.converted).length;
  const newCount = visitors.filter(v => v.status === 'new').length;
  const baptismPendingCount = visitors.filter(v => v.baptismPending).length;
  const followingCount = visitors.filter(v => v.status === 'following').length;
  const regularCount = visitors.filter(v => v.status === 'regular').length;
  
  const conversionRate = totalVisitors > 0 ? Math.round((convertedCount / totalVisitors) * 100) : 0;
  const averageVisits = visitors.length > 0 ? Math.round(visitors.reduce((acc, v) => acc + (v.visitCount || 1), 0) / visitors.length) : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          <h2 className="text-2xl font-bold text-blue-900">Gestión de Visitantes</h2>
          <p className="text-gray-400 text-sm mt-0.5">{total} visitantes registrados en el sistema</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar PDF
          </button>
          <button
            onClick={() => { setShowModal(true); setForm(defaultForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo Visitante
          </button>
        </div>
      </div>

      {/* KPIs Interactivos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-blue-900">{totalVisitors}</p>
          <p className="text-xs text-gray-400">Total Visitantes</p>
          <div className="mt-1 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
              <Heart size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600">{convertedCount}</p>
          <p className="text-xs text-gray-400">Convertidos</p>
          <div className="mt-1 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-yellow-600">{newCount}</p>
          <p className="text-xs text-gray-400">Nuevos</p>
          <div className="mt-1 h-1 w-full bg-yellow-100 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-600 rounded-full" style={{ width: totalVisitors > 0 ? `${(newCount / totalVisitors) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
              <Award size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-purple-600">{baptismPendingCount}</p>
          <p className="text-xs text-gray-400">Bautismo Pendiente</p>
          <div className="mt-1 h-1 w-full bg-purple-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: totalVisitors > 0 ? `${(baptismPendingCount / totalVisitors) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
              <MessageSquare size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-600">{followingCount}</p>
          <p className="text-xs text-gray-400">En Seguimiento</p>
          <div className="mt-1 h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: totalVisitors > 0 ? `${(followingCount / totalVisitors) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-orange-600">{conversionRate}%</p>
          <p className="text-xs text-gray-400">Tasa de Conversión</p>
          <div className="mt-1 h-1 w-full bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-600 rounded-full" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, teléfono..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field w-40"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos</option>
            <option value="new">Nuevos</option>
            <option value="contacted">Contactados</option>
            <option value="following">En Seguimiento</option>
            <option value="regular">Regulares</option>
            <option value="converted">Convertidos</option>
            <option value="baptized">Bautizados</option>
          </select>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={15} className="inline mr-1" />
              Tabla
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye size={15} className="inline mr-1" />
              Tarjetas
            </button>
          </div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-premium p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-3/4 mb-2" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : visitors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No se encontraron visitantes</p>
              <p className="text-gray-300 text-sm mt-1">Registra el primer visitante usando el botón de arriba</p>
            </div>
          ) : (
            visitors.map((visitor) => {
              const StatusIcon = statusIcons[visitor.status] || Users;
              return (
                <div key={visitor.id} className="card-premium p-4 hover:shadow-lg transition-shadow group">
                  {/* Foto y nombre */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {visitor.photoUrl ? (
                          <img 
                            src={visitor.photoUrl} 
                            alt={`${visitor.firstName} ${visitor.lastName}`}
                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(visitor.firstName, visitor.lastName)}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          visitor.status === 'converted' || visitor.status === 'baptized' ? 'bg-green-500' :
                          visitor.status === 'following' ? 'bg-blue-500' :
                          visitor.status === 'regular' ? 'bg-green-400' :
                          visitor.status === 'contacted' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {visitor.firstName} {visitor.lastName}
                        </h4>
                        <div className="flex items-center gap-1">
                          <StatusIcon size={12} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{statusLabels[visitor.status] || visitor.status}</p>
                        </div>
                      </div>
                    </div>
                    {visitor.visitCount && visitor.visitCount > 1 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        {visitor.visitCount} visitas
                      </span>
                    )}
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-1.5 mb-3">
                    {visitor.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{visitor.email}</span>
                      </div>
                    )}
                    {visitor.cellPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span>{visitor.cellPhone}</span>
                      </div>
                    )}
                    {visitor.origin && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <UserPlus size={12} className="text-gray-400 flex-shrink-0" />
                        <span>{originLabels[visitor.origin] || visitor.origin}</span>
                      </div>
                    )}
                  </div>

                  {/* Fechas y estado de conversión */}
                  <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-gray-400">1ra visita: </span>
                      <span className="font-medium">{formatDateShort(visitor.firstVisitDate)}</span>
                    </div>
                    {visitor.converted && (
                      <div className="flex items-center gap-1">
                        <Heart size={12} className="text-red-500" />
                        <span className="text-green-600 font-medium">Convertido</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowDetail(visitor)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleEdit(visitor)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(visitor.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Visitante</th>
                  <th>Contacto</th>
                  <th>Primera Visita</th>
                  <th>Visitas</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th>Conversión</th>
                  <th>Acciones</th>
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
                ) : visitors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 font-medium">No se encontraron visitantes</p>
                    </td>
                  </tr>
                ) : (
                  visitors.map((visitor) => (
                    <tr key={visitor.id} className="group">
                      <td>
                        <div className="flex items-center gap-2">
                          {visitor.photoUrl ? (
                            <img 
                              src={visitor.photoUrl} 
                              alt={`${visitor.firstName} ${visitor.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="avatar-placeholder" style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}>
                              {getInitials(visitor.firstName, visitor.lastName)}
                            </div>
                          )}
                          <span className="font-medium text-sm">{visitor.firstName} {visitor.lastName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {visitor.cellPhone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} />{visitor.cellPhone}</div>}
                          {visitor.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail size={11} />{visitor.email}</div>}
                        </div>
                      </td>
                      <td><span className="text-sm text-gray-600">{formatDate(visitor.firstVisitDate)}</span></td>
                      <td><span className="text-sm text-gray-600">{visitor.visitCount || 1}</span></td>
                      <td><span className="text-xs text-gray-500">{originLabels[visitor.origin] || visitor.origin || "—"}</span></td>
                      <td>
                        <span className={`badge ${statusColors[visitor.status]}`}>
                          {statusLabels[visitor.status] || visitor.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${visitor.converted ? "badge-success" : "badge-warning"}`}>
                          {visitor.converted ? "✓ Convertido" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setShowDetail(visitor)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(visitor)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(visitor.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Mostrando {visitors.length} de {total} visitantes</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-500 px-2">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination for Card View */}
      {viewMode === 'cards' && visitors.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-xs text-gray-400">Mostrando {visitors.length} de {total} visitantes</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 px-2">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-3xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">
                {editingId ? "Editar Visitante" : "Registrar Visitante"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Visitante guardado exitosamente!</span>
                </div>
              )}

              {/* Foto de Perfil */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera size={14} /> Foto de Perfil
                </h4>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {form.photoUrl ? (
                      <img 
                        src={form.photoUrl} 
                        alt="Foto de perfil"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {getInitials(form.firstName || '?', form.lastName || '?')}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1.5 rounded-full hover:bg-purple-700 transition-colors shadow-md"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-gray-500">
                      Haz clic en el icono de la cámara para subir una foto
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Formatos: JPG, PNG, GIF • Máx: 5MB
                    </p>
                    {form.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, photoUrl: '', photoFile: undefined })}
                        className="text-xs text-red-500 hover:text-red-600 mt-1"
                      >
                        Eliminar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Información Personal */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <UserPlus size={14} /> Información Personal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre *</label>
                    <input className="input-field" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Nombre" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido *</label>
                    <input className="input-field" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sexo</label>
                    <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Seleccionar</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Nacimiento</label>
                    <input type="date" className="input-field" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Documento de Identidad</label>
                    <input className="input-field" value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} placeholder="Cédula / Pasaporte" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Origen</label>
                    <select className="input-field" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
                      <option value="">Seleccionar</option>
                      <option value="friend">Amigo/Familiar</option>
                      <option value="social_media">Redes Sociales</option>
                      <option value="event">Evento Especial</option>
                      <option value="door_to_door">Visita a Hogar</option>
                      <option value="online">Servicio Online</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección</label>
                    <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle, sector, ciudad..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Contacto */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Phone size={14} /> Contacto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                    <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono fijo" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Celular</label>
                    <input className="input-field" value={form.cellPhone} onChange={(e) => setForm({ ...form, cellPhone: e.target.value })} placeholder="Celular / WhatsApp" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico</label>
                    <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Información de Visita */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Información de Visita
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Primera Visita *</label>
                    <input type="date" className="input-field" required value={form.firstVisitDate} onChange={(e) => setForm({ ...form, firstVisitDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="new">Nuevo</option>
                      <option value="contacted">Contactado</option>
                      <option value="following">En Seguimiento</option>
                      <option value="regular">Regular</option>
                      <option value="converted">Convertido</option>
                      <option value="baptized">Bautizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Intereses / Necesidades</label>
                    <input className="input-field" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="¿Qué lo trajo a la iglesia?" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Decisión Tomada</label>
                    <input className="input-field" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} placeholder="Aceptó a Cristo, se interesó en bautismo..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Seguido por</label>
                    <input className="input-field" value={form.followedBy} onChange={(e) => setForm({ ...form, followedBy: e.target.value })} placeholder="Pastor o líder a cargo" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas de Seguimiento</label>
                    <input className="input-field" value={form.followUpNotes} onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })} placeholder="Próximos pasos..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Conversión y Bautismo */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Heart size={14} /> Conversión y Bautismo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="converted" checked={form.converted} onChange={(e) => setForm({ ...form, converted: e.target.checked })} className="w-4 h-4 rounded accent-purple-600" />
                    <label htmlFor="converted" className="text-sm text-gray-600">Convertido</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="baptismPending" checked={form.baptismPending} onChange={(e) => setForm({ ...form, baptismPending: e.target.checked })} className="w-4 h-4 rounded accent-purple-600" />
                    <label htmlFor="baptismPending" className="text-sm text-gray-600">Bautismo pendiente</label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Conversión</label>
                    <input type="date" className="input-field" value={form.conversionDate} onChange={(e) => setForm({ ...form, conversionDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Bautismo</label>
                    <input type="date" className="input-field" value={form.baptismDate} onChange={(e) => setForm({ ...form, baptismDate: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Observaciones</label>
                  <textarea className="input-field resize-none" rows={3} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="Notas generales..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Notas Privadas</label>
                  <textarea className="input-field resize-none" rows={3} value={form.privateNotes} onChange={(e) => setForm({ ...form, privateNotes: e.target.value })} placeholder="Solo visible para pastores..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Registrar Visitante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal-content max-w-lg">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  {showDetail.photoUrl ? (
                    <img 
                      src={showDetail.photoUrl} 
                      alt={`${showDetail.firstName} ${showDetail.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl" style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: 700 }}>
                      {getInitials(showDetail.firstName, showDetail.lastName)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{showDetail.firstName} {showDetail.lastName}</h3>
                    <span className={`badge ${statusColors[showDetail.status]}`}>{statusLabels[showDetail.status]}</span>
                  </div>
                </div>
                <button onClick={() => setShowDetail(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Sexo</p>
                    <p className="font-medium text-sm text-gray-800">{genderLabels[showDetail.gender] || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Origen</p>
                    <p className="font-medium text-sm text-gray-800">{originLabels[showDetail.origin] || showDetail.origin || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Primera Visita</p>
                    <p className="font-medium text-sm text-gray-800">{formatDate(showDetail.firstVisitDate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Visitas</p>
                    <p className="font-medium text-sm text-gray-800">{showDetail.visitCount || 1}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {showDetail.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {showDetail.email}
                    </div>
                  )}
                  {showDetail.cellPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {showDetail.cellPhone}
                    </div>
                  )}
                  {showDetail.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400" />
                      {showDetail.address}
                    </div>
                  )}
                </div>

                <div className="divider" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-green-50">
                    <p className="text-xs text-gray-400 mb-0.5">Conversión</p>
                    <p className="font-semibold text-sm text-green-800">
                      {showDetail.converted ? "✓ Convertido" : "Pendiente"}
                    </p>
                    {showDetail.conversionDate && (
                      <p className="text-xs text-gray-500 mt-0.5">{formatDateShort(showDetail.conversionDate)}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <p className="text-xs text-gray-400 mb-0.5">Bautismo</p>
                    <p className="font-semibold text-sm text-purple-800">
                      {showDetail.baptismPending ? "Pendiente" : "No aplica"}
                    </p>
                    {showDetail.baptismDate && (
                      <p className="text-xs text-gray-500 mt-0.5">{formatDateShort(showDetail.baptismDate)}</p>
                    )}
                  </div>
                </div>

                {showDetail.interests && (
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Intereses / Necesidades</p>
                    <p className="text-sm text-gray-700">{showDetail.interests}</p>
                  </div>
                )}

                {showDetail.decision && (
                  <div className="p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-gray-400 mb-1">Decisión Tomada</p>
                    <p className="text-sm text-gray-700">{showDetail.decision}</p>
                  </div>
                )}

                {showDetail.followUpNotes && (
                  <div className="p-3 rounded-xl bg-yellow-50">
                    <p className="text-xs text-gray-400 mb-1">Notas de Seguimiento</p>
                    <p className="text-sm text-gray-700">{showDetail.followUpNotes}</p>
                  </div>
                )}

                {showDetail.observations && (
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700">{showDetail.observations}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => { setShowDetail(null); handleEdit(showDetail); }} className="btn-primary flex-1">Editar</button>
                <button onClick={() => setShowDetail(null)} className="btn-outline flex-1">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 NUEVO: MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Visitante</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente este visitante del sistema. 
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