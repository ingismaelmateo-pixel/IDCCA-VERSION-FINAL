"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UsersRound, Plus, X, Check, Users, Calendar, Target,
  Search, Filter, Download, Upload, Edit2, Trash2, Eye,
  MapPin, Clock, Award, TrendingUp, UserPlus, UserCheck,
  ChevronLeft, ChevronRight, Camera, Building2, Phone,
  Mail, BookOpen, Heart, Music, Church, UserX, Sparkles,
  AlertCircle
} from "lucide-react";
import { formatDate, getInitials, formatDateShort } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Ministry {
  id: number;
  name: string;
  description: string;
  leaderId: number | null;
  leaderName: string | null;
  subLeaderId: number | null;
  subLeaderName?: string | null;
  type: string;
  status: string;
  meetingDay: string;
  meetingTime: string;
  meetingLocation: string;
  meetingFrequency: string;
  meetingSchedule: string;
  objectives: string;
  vision: string;
  goals: string;
  budget: string;
  isActive: boolean;
  memberCount: number;
  email: string;
  phone: string;
  photoUrl: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

interface MinistryFormData {
  name: string;
  description: string;
  leaderId: string;
  subLeaderId: string;
  type: string;
  status: string;
  meetingDay: string;
  meetingTime: string;
  meetingLocation: string;
  meetingFrequency: string;
  objectives: string;
  vision: string;
  goals: string;
  budget: string;
  isActive: boolean;
  email: string;
  phone: string;
  photoUrl: string;
  observations: string;
  photoFile?: File;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  cellPhone: string;
}

const ministryTypes = [
  { value: 'musical', label: '🎵 Musical', icon: Music },
  { value: 'ensenanza', label: '📖 Enseñanza', icon: BookOpen },
  { value: 'servicio', label: '🤝 Servicio', icon: Users },
  { value: 'jovenes', label: '🙏 Jóvenes', icon: Sparkles },
  { value: 'infantil', label: '👦 Infantil', icon: Users },
  { value: 'misiones', label: '✈️ Misiones', icon: Church },
  { value: 'oracion', label: '🕊️ Oración', icon: Heart },
  { value: 'varones', label: '👨 Varones', icon: Users },
  { value: 'damas', label: '👩 Damas', icon: Users },
  { value: 'familia', label: '🏠 Familia', icon: Building2 },
];

const statusColors: Record<string, string> = {
  active: "badge-success",
  inactive: "badge-danger",
  on_hold: "badge-warning",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  on_hold: "En Pausa",
};

const dayLabels: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

const defaultForm: MinistryFormData = {
  name: "",
  description: "",
  leaderId: "",
  subLeaderId: "",
  type: "",
  status: "active",
  meetingDay: "",
  meetingTime: "",
  meetingLocation: "",
  meetingFrequency: "weekly",
  objectives: "",
  vision: "",
  goals: "",
  budget: "",
  isActive: true,
  email: "",
  phone: "",
  photoUrl: "",
  observations: "",
};

export default function Ministries() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Ministry | null>(null);

  const [showMembersModal, setShowMembersModal] = useState<Ministry | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [loadingMembersModal, setLoadingMembersModal] = useState(false);

  const [form, setForm] = useState<MinistryFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMinistries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        search,
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/ministries?${params}`);
      const data = await res.json();
      
      const ministriesWithCount = (data.data || []).map((m: Ministry) => ({
        ...m,
        memberCount: Number(m.memberCount) || 0
      }));
      
      setMinistries(ministriesWithCount);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      showToast("❌ Error al cargar los ministerios", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members?limit=100");
      const data = await res.json();
      setMembers(data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchMinistries();
    fetchMembers();
  }, [fetchMinistries, fetchMembers]);

  const handleOpenMembersModal = async (ministry: Ministry) => {
    setShowMembersModal(ministry);
    setSelectedMemberIds([]);
    setLoadingMembersModal(true);
    try {
      const res = await fetch(`/api/ministries/${ministry.id}/members`);
      if (!res.ok) throw new Error("Error al cargar miembros actuales");
      const data = await res.json();
      const memberIds = data.memberIds ? data.memberIds.map((id: any) => Number(id)) : [];
      setSelectedMemberIds(memberIds);
    } catch (e) {
      console.error(e);
      showToast("❌ Error al cargar los miembros actuales del ministerio", "error");
    } finally {
      setLoadingMembersModal(false);
    }
  };

  const handleAssignMembers = async () => {
    if (!showMembersModal) return;
    setSavingMembers(true);
    try {
      const res = await fetch(`/api/ministries/${showMembersModal.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedMemberIds }),
      });

      if (res.ok) {
        const data = await res.json();
        
        setMinistries(prev => 
          prev.map(m => 
            m.id === showMembersModal.id 
              ? { 
                  ...m, 
                  memberCount: data.memberCount || selectedMemberIds.length
                }
              : m
          )
        );
        
        showToast(`✅ ${data.message || 'Miembros asignados correctamente'}`, 'success');
        setShowMembersModal(null);
        await fetchMinistries();
        
      } else {
        const errorData = await res.json();
        showToast(`❌ ${errorData.error || 'Error al asignar los miembros'}`, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión al guardar", 'error');
    } finally {
      setSavingMembers(false);
    }
  };

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
    
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/ministries/${editingId}` : "/api/ministries";

      const formData = {
        ...form,
        leaderId: form.leaderId ? Number(form.leaderId) : null,
        subLeaderId: form.subLeaderId ? Number(form.subLeaderId) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Intentar parsear la respuesta
      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }

      if (res.ok) {
        setSuccess(true);
        showToast(editingId ? "✅ Ministerio actualizado correctamente" : "✅ Ministerio creado correctamente", 'success');
        setTimeout(() => {
          setSuccess(false);
          setShowModal(false);
          setForm(defaultForm);
          setEditingId(null);
          fetchMinistries();
        }, 1500);
      } else {
        const errorMessage = (data as any)?.error || (data as any)?.message || `Error ${res.status}`;
        showToast(`❌ ${errorMessage}`, 'error');
      }
    } catch (e) {
      console.error('Error en handleSubmit:', e);
      showToast("❌ Error de conexión al guardar", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ministry: Ministry) => {
    setEditingId(ministry.id);
    setForm({
      name: ministry.name || "",
      description: ministry.description || "",
      leaderId: ministry.leaderId?.toString() || "",
      subLeaderId: ministry.subLeaderId?.toString() || "",
      type: ministry.type || "",
      status: ministry.status || "active",
      meetingDay: ministry.meetingDay || "",
      meetingTime: ministry.meetingTime || "",
      meetingLocation: ministry.meetingLocation || "",
      meetingFrequency: ministry.meetingFrequency || "weekly",
      objectives: ministry.objectives || "",
      vision: ministry.vision || "",
      goals: ministry.goals || "",
      budget: ministry.budget || "",
      isActive: ministry.isActive ?? true,
      email: ministry.email || "",
      phone: ministry.phone || "",
      photoUrl: ministry.photoUrl || "",
      observations: ministry.observations || "",
    });
    setShowModal(true);
  };

  const handleConfirmDelete = (id: number) => {
    setDeleteTarget(id);
  };

  // 🔧 FUNCIÓN CORREGIDA: handleDelete con verificación de miembros
  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      const res = await fetch(`/api/ministries/${deleteTarget}`, { 
        method: "DELETE" 
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setDeleteTarget(null);
        showToast("🗑️ Ministerio eliminado correctamente", 'success');
        fetchMinistries();
      } else {
        // ✅ Mostrar el mensaje de error del servidor (incluyendo el de miembros)
        showToast(`❌ ${data.error || 'Error al eliminar el ministerio'}`, 'error');
        
        // Si el error es por miembros, cerrar el modal y mostrar el error
        if (data.memberCount > 0) {
          setDeleteTarget(null);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión al eliminar", 'error');
    }
  };

  const handleExportPDF = () => {
    if (ministries.length === 0) {
      showToast("ℹ️ No hay ministerios para exportar.", 'error');
      return;
    }

    const doc = new jsPDF();
    const title = `Lista de Ministerios - ${new Date().toLocaleDateString()}`;

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total: ${ministries.length} ministerios`, 14, 28);

    const tableData = ministries.map((m) => [
      m.name,
      m.leaderName || "—",
      statusLabels[m.status] || m.status,
      dayLabels[m.meetingDay] || m.meetingDay || "—",
      m.meetingTime || "—",
      m.memberCount || 0
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Nombre", "Líder", "Estado", "Día", "Hora", "Miembros"]],
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

    doc.save(`ministerios_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("✅ Reporte de ministerios exportado exitosamente", "success");
  };

  const totalMinistries = total;
  const activeCount = ministries.filter(m => m.status === 'active' || m.isActive).length;
  const inactiveCount = ministries.filter(m => m.status === 'inactive' || !m.isActive).length;
  const totalMembers = ministries.reduce((acc, m) => acc + (m.memberCount || 0), 0);
  const avgMembers = totalMinistries > 0 ? Math.round(totalMembers / totalMinistries) : 0;

  const typeStats = ministryTypes.map(type => ({
    ...type,
    count: ministries.filter(m => m.type === type.value).length
  })).filter(t => t.count > 0);

    return (
    <div className="space-y-6">

      {/* TOAST NOTIFICATION */}
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
          <h2 className="text-2xl font-bold text-blue-900">Gestión de Ministerios</h2>
          <p className="text-gray-400 text-sm mt-0.5">{total} ministerios registrados en el sistema</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar PDF
          </button>
          <button
            onClick={() => { setShowModal(true); setForm(defaultForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo Ministerio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card-premium p-4 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group border-t-4 border-blue-500 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900 tracking-tight">{totalMinistries}</p>
          <p className="text-xs text-gray-500 font-medium">Total Ministerios</p>
        </div>

        <div className="card-premium p-4 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group border-t-4 border-green-500 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2.5 rounded-full bg-green-100 text-green-600 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Users size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600 tracking-tight">{totalMembers}</p>
          <p className="text-xs text-gray-500 font-medium">Miembros Totales</p>
        </div>

        <div className="card-premium p-4 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group border-t-4 border-emerald-500 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <UserCheck size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tracking-tight">{activeCount}</p>
          <p className="text-xs text-gray-500 font-medium">Ministerios Activos</p>
        </div>

        <div className="card-premium p-4 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group border-t-4 border-purple-500 bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2.5 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 tracking-tight">{avgMembers}</p>
          <p className="text-xs text-gray-500 font-medium">Promedio por Ministerio</p>
        </div>

        <div className="card-premium p-4 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group border-t-4 border-orange-500 bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2.5 rounded-full bg-orange-100 text-orange-600 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Award size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600 tracking-tight">{typeStats.length}</p>
          <p className="text-xs text-gray-500 font-medium">Tipos de Ministerio</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, líder, tipo..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field w-40"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos los tipos</option>
            {ministryTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            className="input-field w-40"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="on_hold">En Pausa</option>
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
          ) : ministries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No se encontraron ministerios</p>
              <p className="text-gray-300 text-sm mt-1">Crea tu primer ministerio usando el botón de arriba</p>
            </div>
          ) : (
            ministries.map((ministry) => {
              const typeInfo = ministryTypes.find(t => t.value === ministry.type);
              const TypeIcon = typeInfo?.icon || Building2;
              const StatusIcon = ministry.status === 'active' ? UserCheck : UserX;

              return (
                <div key={ministry.id} className="card-premium p-4 hover:shadow-lg transition-shadow group relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {ministry.photoUrl ? (
                          <img
                            src={ministry.photoUrl}
                            alt={ministry.name}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                            {ministry.name.charAt(0)}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          ministry.status === 'active' || ministry.isActive ? 'bg-green-500' :
                          ministry.status === 'on_hold' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                          {ministry.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          <TypeIcon size={12} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{typeInfo?.label || ministry.type || "Sin tipo"}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${statusColors[ministry.status] || "badge-info"} text-xs`}>
                      {statusLabels[ministry.status] || (ministry.isActive ? "Activo" : "Inactivo")}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {ministry.leaderName && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <UserPlus size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">Líder: {ministry.leaderName}</span>
                      </div>
                    )}
                    {ministry.memberCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => handleOpenMembersModal(ministry)}>
                        <Users size={12} className="text-blue-400 flex-shrink-0" />
                        <span>{ministry.memberCount} miembros</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleOpenMembersModal(ministry)}>
                        <Users size={12} className="text-gray-400 flex-shrink-0" />
                        <span>0 miembros <span className="text-blue-400 underline decoration-dotted">(Gestionar)</span></span>
                      </div>
                    )}
                    {ministry.meetingDay && ministry.meetingTime && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                        <span>{dayLabels[ministry.meetingDay] || ministry.meetingDay}: {ministry.meetingTime}</span>
                      </div>
                    )}
                    {ministry.meetingLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{ministry.meetingLocation}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Capacidad</span>
                      <span>{ministry.memberCount || 0} miembros</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${Math.min((ministry.memberCount || 0) * 2, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenMembersModal(ministry)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      title="Gestionar Miembros"
                    >
                      <Users size={15} />
                    </button>

                    <button
                      onClick={() => setShowDetail(ministry)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleEdit(ministry)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(ministry.id)}
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
                  <th>Ministerio</th>
                  <th>Tipo</th>
                  <th>Líder</th>
                  <th>Miembros</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : ministries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Building2 size={48} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 font-medium">No se encontraron ministerios</p>
                    </td>
                  </tr>
                ) : (
                  ministries.map((ministry) => {
                    const typeInfo = ministryTypes.find(t => t.value === ministry.type);
                    return (
                      <tr key={ministry.id} className="group">
                        <td>
                          <div className="flex items-center gap-2">
                            {ministry.photoUrl ? (
                              <img
                                src={ministry.photoUrl}
                                alt={ministry.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {ministry.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-sm">{ministry.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-gray-500">{typeInfo?.label || ministry.type || "—"}</span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">{ministry.leaderName || "Sin líder"}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenMembersModal(ministry)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Users size={14} /> {ministry.memberCount || 0}
                          </button>
                        </td>
                        <td>
                          <span className="text-xs text-gray-500">
                            {ministry.meetingDay && ministry.meetingTime
                              ? `${dayLabels[ministry.meetingDay] || ministry.meetingDay} ${ministry.meetingTime}`
                              : "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusColors[ministry.status] || (ministry.isActive ? "badge-success" : "badge-danger")}`}>
                            {statusLabels[ministry.status] || (ministry.isActive ? "Activo" : "Inactivo")}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setShowDetail(ministry)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(ministry)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(ministry.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Mostrando {ministries.length} de {total} ministerios</p>
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
      {viewMode === 'cards' && ministries.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-xs text-gray-400">Mostrando {ministries.length} de {total} ministerios</p>
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
                {editingId ? "Editar Ministerio" : "Nuevo Ministerio"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Ministerio guardado exitosamente!</span>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera size={14} /> Logo del Ministerio
                </h4>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt="Logo del ministerio"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                        {form.name ? form.name.charAt(0) : "?"}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById('ministry-photo-upload')?.click()}
                      className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      id="ministry-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-gray-500">
                      Haz clic en el icono de la cámara para subir un logo
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
                        Eliminar logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 size={14} /> Información Básica
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del Ministerio *</label>
                    <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ministerio de Alabanza" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                    <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="">Seleccionar tipo</option>
                      {ministryTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="on_hold">En Pausa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Líder</label>
                    <select className="input-field" value={form.leaderId} onChange={(e) => setForm({ ...form, leaderId: e.target.value })}>
                      <option value="">Seleccionar líder</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sub-líder</label>
                    <select className="input-field" value={form.subLeaderId} onChange={(e) => setForm({ ...form, subLeaderId: e.target.value })}>
                      <option value="">Seleccionar sub-líder</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Phone size={14} /> Contacto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico</label>
                    <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ministerio@ejemplo.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                    <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="809-000-0000" />
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Reuniones
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Día de Reunión</label>
                    <select className="input-field" value={form.meetingDay} onChange={(e) => setForm({ ...form, meetingDay: e.target.value })}>
                      <option value="">Seleccionar día</option>
                      <option value="monday">Lunes</option>
                      <option value="tuesday">Martes</option>
                      <option value="wednesday">Miércoles</option>
                      <option value="thursday">Jueves</option>
                      <option value="friday">Viernes</option>
                      <option value="saturday">Sábado</option>
                      <option value="sunday">Domingo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hora</label>
                    <input type="time" className="input-field" value={form.meetingTime} onChange={(e) => setForm({ ...form, meetingTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Frecuencia</label>
                    <select className="input-field" value={form.meetingFrequency} onChange={(e) => setForm({ ...form, meetingFrequency: e.target.value })}>
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ubicación</label>
                    <input className="input-field" value={form.meetingLocation} onChange={(e) => setForm({ ...form, meetingLocation: e.target.value })} placeholder="Salón Principal, Capilla, etc." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Target size={14} /> Visión y Objetivos
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                    <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Propósito y misión del ministerio..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Visión</label>
                    <textarea className="input-field resize-none" rows={2} value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} placeholder="Visión a largo plazo del ministerio..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Objetivos</label>
                    <textarea className="input-field resize-none" rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="Objetivos específicos..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Metas</label>
                    <textarea className="input-field resize-none" rows={2} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="Metas y KPIs del ministerio..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Presupuesto (RD$)</label>
                  <input type="number" className="input-field" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Observaciones</label>
                  <textarea className="input-field resize-none" rows={1} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="Notas adicionales..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Ministerio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE GESTIÓN DE MIEMBROS */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowMembersModal(null)}>
          <div className="modal-content max-w-2xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                <h3 className="font-bold text-lg text-blue-900">
                  Gestionar Miembros: <span className="text-gray-700">{showMembersModal.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowMembersModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500 mb-4">Selecciona los miembros que pertenecen a este ministerio:</p>

              {loadingMembersModal ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <UserX size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No hay miembros registrados en el sistema.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {members.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedMemberIds.includes(member.id)
                          ? 'border-blue-500 bg-blue-50/80'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 accent-blue-600 cursor-pointer mr-4"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMemberIds(prev => [...prev, member.id]);
                          } else {
                            setSelectedMemberIds(prev => prev.filter(id => id !== member.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{member.email || member.cellPhone || "Sin contacto"}</p>
                      </div>
                      {selectedMemberIds.includes(member.id) && (
                        <Check size={18} className="text-blue-600 shrink-0 ml-2" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowMembersModal(null)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAssignMembers}
                disabled={savingMembers || loadingMembersModal}
                className="btn-primary flex items-center gap-2"
              >
                {savingMembers ? "Guardando..." : <><Check size={16} /> Guardar Miembros</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal-content max-w-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  {showDetail.photoUrl ? (
                    <img
                      src={showDetail.photoUrl}
                      alt={showDetail.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {showDetail.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{showDetail.name}</h3>
                    <span className={`badge ${statusColors[showDetail.status] || (showDetail.isActive ? "badge-success" : "badge-danger")}`}>
                      {statusLabels[showDetail.status] || (showDetail.isActive ? "Activo" : "Inactivo")}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowDetail(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Tipo</p>
                    <p className="font-medium text-sm text-gray-800">
                      {ministryTypes.find(t => t.value === showDetail.type)?.label || showDetail.type || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Miembros</p>
                    <p className="font-medium text-sm text-gray-800">{showDetail.memberCount || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Líder</p>
                    <p className="font-medium text-sm text-gray-800">{showDetail.leaderName || "Sin líder"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Presupuesto</p>
                    <p className="font-medium text-sm text-gray-800">RD$ {Number(showDetail.budget || 0).toLocaleString()}</p>
                  </div>
                </div>

                {showDetail.description && (
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Descripción</p>
                    <p className="text-sm text-gray-700">{showDetail.description}</p>
                  </div>
                )}

                {(showDetail.meetingDay || showDetail.meetingTime || showDetail.meetingLocation) && (
                  <div className="p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-gray-400 mb-2">Reuniones</p>
                    <div className="space-y-1.5">
                      {showDetail.meetingDay && showDetail.meetingTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar size={14} className="text-blue-500" />
                          <span>{dayLabels[showDetail.meetingDay] || showDetail.meetingDay}: {showDetail.meetingTime}</span>
                          {showDetail.meetingFrequency && (
                            <span className="text-xs text-gray-500">({frequencyLabels[showDetail.meetingFrequency]})</span>
                          )}
                        </div>
                      )}
                      {showDetail.meetingLocation && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={14} className="text-blue-500" />
                          <span>{showDetail.meetingLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showDetail.vision && (
                  <div className="p-3 rounded-xl bg-purple-50">
                    <p className="text-xs text-gray-400 mb-1">Visión</p>
                    <p className="text-sm text-gray-700">{showDetail.vision}</p>
                  </div>
                )}

                {showDetail.objectives && (
                  <div className="p-3 rounded-xl bg-green-50">
                    <p className="text-xs text-gray-400 mb-1">Objetivos</p>
                    <p className="text-sm text-gray-700">{showDetail.objectives}</p>
                  </div>
                )}

                {showDetail.goals && (
                  <div className="p-3 rounded-xl bg-yellow-50">
                    <p className="text-xs text-gray-400 mb-1">Metas</p>
                    <p className="text-sm text-gray-700">{showDetail.goals}</p>
                  </div>
                )}

                {showDetail.observations && (
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700">{showDetail.observations}</p>
                  </div>
                )}

                <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  Creado: {formatDate(showDetail.createdAt)}
                  {showDetail.updatedAt && ` • Actualizado: ${formatDate(showDetail.updatedAt)}`}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => { setShowDetail(null); handleEdit(showDetail); }} className="btn-primary flex-1">Editar</button>
                <button onClick={() => setShowDetail(null)} className="btn-outline flex-1">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Ministerio</h3>
            {(() => {
              const ministryToDelete = ministries.find(m => m.id === deleteTarget);
              const hasMembers = (ministryToDelete?.memberCount || 0) > 0;
              return (
                <>
                  <p className="text-sm text-gray-500 mb-2">
                    ¿Estás seguro de eliminar el ministerio <strong>{ministryToDelete?.name || 'este ministerio'}</strong>?
                  </p>
                  {hasMembers && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-yellow-700">
                        ⚠️ Este ministerio tiene <strong>{ministryToDelete?.memberCount || 0}</strong> miembros activos.
                        <br />
                        <span className="text-xs">No se puede eliminar hasta que los miembros sean reasignados o eliminados.</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-red-400 mb-6">
                    {hasMembers ? '❌ No se puede eliminar este ministerio' : '⚠️ Esta acción no se puede deshacer.'}
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
                      disabled={hasMembers}
                      className={`px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-colors duration-200 ${
                        hasMembers
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 shadow-md'
                      }`}
                    >
                      {hasMembers ? 'No se puede eliminar' : 'Sí, Eliminar'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}