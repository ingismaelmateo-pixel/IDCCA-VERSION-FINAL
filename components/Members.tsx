"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, Plus, Filter, Download, Upload,
  Edit2, Trash2, Eye, Phone, Mail, MapPin, Calendar,
  ChevronLeft, ChevronRight, X, Check, AlertCircle, Camera
} from "lucide-react";
import { formatDate, getInitials, formatDateShort } from "@/lib/utils";
// 📦 IMPORTAMOS LAS LIBRERÍAS DE PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  phone: string;
  cellPhone: string;
  email: string;
  documentId: string;
  joinDate: string;
  baptismDate: string;
  conversionDate: string;
  profession: string;
  status: string;
  ministryId: number;
  observations: string;
  photoUrl: string;
  createdAt: string;
}

interface MemberFormData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  phone: string;
  cellPhone: string;
  email: string;
  documentId: string;
  joinDate: string;
  baptismDate: string;
  conversionDate: string;
  profession: string;
  company: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  emergencyContact: string;
  emergencyPhone: string;
  status: string;
  observations: string;
  privateNotes: string;
  photoUrl: string;
  photoFile?: File;
}

const statusColors: Record<string, string> = {
  active: "badge-success",
  inactive: "badge-danger",
  visitor: "badge-info",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  visitor: "Visitante",
};

const genderLabels: Record<string, string> = {
  male: "Masculino",
  female: "Femenino",
};

const maritalLabels: Record<string, string> = {
  single: "Soltero/a",
  married: "Casado/a",
  divorced: "Divorciado/a",
  widowed: "Viudo/a",
};

const defaultForm: MemberFormData = {
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  maritalStatus: "",
  address: "",
  phone: "",
  cellPhone: "",
  email: "",
  documentId: "",
  joinDate: new Date().toISOString().split("T")[0],
  baptismDate: "",
  conversionDate: "",
  profession: "",
  company: "",
  facebook: "",
  instagram: "",
  whatsapp: "",
  emergencyContact: "",
  emergencyPhone: "",
  status: "active",
  observations: "",
  privateNotes: "",
  photoUrl: "",
};

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // 🔥 NUEVOS ESTADOS: Modal de confirmación para eliminar
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        search,
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/members?${params}`);
      const data = await res.json();
      setMembers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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
      const url = editingId ? `/api/members/${editingId}` : "/api/members";
      
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
          fetchMembers();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingId(member.id);
    setForm({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      gender: member.gender || "",
      birthDate: member.birthDate || "",
      maritalStatus: member.maritalStatus || "",
      address: member.address || "",
      phone: member.phone || "",
      cellPhone: member.cellPhone || "",
      email: member.email || "",
      documentId: member.documentId || "",
      joinDate: member.joinDate || "",
      baptismDate: member.baptismDate || "",
      conversionDate: member.conversionDate || "",
      profession: member.profession || "",
      company: "",
      facebook: "",
      instagram: "",
      whatsapp: "",
      emergencyContact: "",
      emergencyPhone: "",
      status: member.status || "active",
      observations: member.observations || "",
      privateNotes: "",
      photoUrl: member.photoUrl || "",
    });
    setShowModal(true);
  };

  // 🔥 NUEVA FUNCIÓN: Manejar la eliminación con el modal interactivo
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/members/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchMembers();
      } else {
        alert("Error al eliminar el miembro");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  // 📄 NUEVA FUNCIÓN: Exportar a PDF
  const handleExportPDF = () => {
    if (members.length === 0) {
      alert("No hay miembros para exportar");
      return;
    }

    const doc = new jsPDF();
    const title = `Lista de Miembros - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total de miembros: ${members.length}`, 14, 28);

    // Preparar datos para la tabla
    const tableData = members.map((m) => [
      `${m.firstName} ${m.lastName}`,
      genderLabels[m.gender] || "—",
      maritalLabels[m.maritalStatus] || "—",
      m.cellPhone || "—",
      m.email || "—",
      statusLabels[m.status] || m.status,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Nombre", "Sexo", "Estado Civil", "Teléfono", "Email", "Estado"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] }, // Color azul oscuro
    });

    doc.save(`miembros_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Gestión de Miembros</h2>
          <p className="text-gray-400 text-sm mt-0.5">{total} miembros registrados en el sistema</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF} 
            className="btn-outline text-sm flex items-center gap-2"
          >
            <Download size={15} /> Exportar PDF
          </button>
          <button
            onClick={() => { setShowModal(true); setForm(defaultForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo Miembro
          </button>
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
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="visitor">Visitantes</option>
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
          ) : members.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No se encontraron miembros</p>
              <p className="text-gray-300 text-sm mt-1">Agrega tu primer miembro usando el botón de arriba</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="card-premium p-4 hover:shadow-lg transition-shadow group">
                {/* Foto de perfil */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {member.photoUrl ? (
                        <img 
                          src={member.photoUrl} 
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {getInitials(member.firstName, member.lastName)}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        member.status === 'active' ? 'bg-green-500' : 
                        member.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-xs text-gray-500">{genderLabels[member.gender] || "—"}</p>
                    </div>
                  </div>
                  <span className={`badge ${statusColors[member.status] || "badge-info"} text-xs`}>
                    {statusLabels[member.status] || member.status}
                  </span>
                </div>

                {/* Información de contacto */}
                <div className="space-y-1.5 mb-3">
                  {member.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.cellPhone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{member.cellPhone}</span>
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{member.address}</span>
                    </div>
                  )}
                </div>

                {/* Fechas importantes */}
                <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div>
                    <span className="text-gray-400">Ingreso: </span>
                    <span className="font-medium">{formatDateShort(member.joinDate)}</span>
                  </div>
                  {member.baptismDate && (
                    <div>
                      <span className="text-gray-400">Bautismo: </span>
                      <span className="font-medium">{formatDateShort(member.baptismDate)}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowDetail(member)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(member)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(member.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
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
                  <th>Miembro</th>
                  <th>Contacto</th>
                  <th>Estado Civil</th>
                  <th>Ingreso</th>
                  <th>Bautismo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full max-w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 font-medium">No se encontraron miembros</p>
                      <p className="text-gray-300 text-sm mt-1">Agrega tu primer miembro usando el botón de arriba</p>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          {member.photoUrl ? (
                            <img 
                              src={member.photoUrl} 
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {getInitials(member.firstName, member.lastName)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{genderLabels[member.gender] || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {member.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail size={12} />
                              <span className="truncate max-w-32">{member.email}</span>
                            </div>
                          )}
                          {member.cellPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone size={12} />
                              <span>{member.cellPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{maritalLabels[member.maritalStatus] || "—"}</span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{formatDate(member.joinDate)}</span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{formatDate(member.baptismDate)}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusColors[member.status] || "badge-info"}`}>
                          {statusLabels[member.status] || member.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setShowDetail(member)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(member)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(member.id)}
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
            <p className="text-xs text-gray-400">Mostrando {members.length} de {total} miembros</p>
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
      {viewMode === 'cards' && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-xs text-gray-400">Mostrando {members.length} de {total} miembros</p>
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

      {/* Member Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-3xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900">
                {editingId ? "Editar Miembro" : "Nuevo Miembro"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Miembro guardado exitosamente!</span>
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
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                        {getInitials(form.firstName || '?', form.lastName || '?')}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-md"
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

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Users size={14} /> Información Personal
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
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado Civil</label>
                    <select className="input-field" value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}>
                      <option value="">Seleccionar</option>
                      <option value="single">Soltero/a</option>
                      <option value="married">Casado/a</option>
                      <option value="divorced">Divorciado/a</option>
                      <option value="widowed">Viudo/a</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Documento de Identidad</label>
                    <input className="input-field" value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} placeholder="Cédula / Pasaporte" />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Contact */}
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico</label>
                    <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp</label>
                    <input className="input-field" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+1 809 000 0000" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección</label>
                    <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle, sector, ciudad..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Church Info */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Información Eclesiástica
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Ingreso</label>
                    <input type="date" className="input-field" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Conversión</label>
                    <input type="date" className="input-field" value={form.conversionDate} onChange={(e) => setForm({ ...form, conversionDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Bautismo</label>
                    <input type="date" className="input-field" value={form.baptismDate} onChange={(e) => setForm({ ...form, baptismDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Profesión</label>
                    <input className="input-field" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Profesión u oficio" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Empresa</label>
                    <input className="input-field" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Empresa donde labora" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="visitor">Visitante</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Emergency Contact */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Contacto de Emergencia</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
                    <input className="input-field" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Nombre del contacto" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                    <input className="input-field" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="Teléfono de emergencia" />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Notes */}
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
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Registrar Miembro"}
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
                    <div className="w-16 h-16 rounded-2xl" style={{ background: "linear-gradient(135deg, #1e3a6e, #2d5299)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: 700 }}>
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
                    <p className="text-xs text-gray-400 mb-0.5">Estado Civil</p>
                    <p className="font-medium text-sm text-gray-800">{maritalLabels[showDetail.maritalStatus] || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Fecha Nacimiento</p>
                    <p className="font-medium text-sm text-gray-800">{formatDate(showDetail.birthDate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Profesión</p>
                    <p className="font-medium text-sm text-gray-800">{showDetail.profession || "—"}</p>
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-gray-400 mb-0.5">Ingreso</p>
                    <p className="font-semibold text-xs text-blue-800">{formatDateShort(showDetail.joinDate)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50">
                    <p className="text-xs text-gray-400 mb-0.5">Conversión</p>
                    <p className="font-semibold text-xs text-green-800">{formatDateShort(showDetail.conversionDate)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-yellow-50">
                    <p className="text-xs text-gray-400 mb-0.5">Bautismo</p>
                    <p className="font-semibold text-xs text-yellow-800">{formatDateShort(showDetail.baptismDate)}</p>
                  </div>
                </div>

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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Miembro</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente a <span className="font-bold">{members.find(m => m.id === deleteTarget)?.firstName} {members.find(m => m.id === deleteTarget)?.lastName}</span> de la base de datos y todas sus relaciones.
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