"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, UserPlus, UserCheck, UserX, 
  Search, Plus, X, Check, Edit2, Trash2, 
  Shield, ShieldAlert, ShieldCheck,
  Filter, RefreshCw, Mail, Phone, Calendar,
  Briefcase, Crown, UserCircle, AlertCircle
} from "lucide-react";

interface StaffMember {
  id: number;
  memberId: number | null;
  username: string;
  email: string;
  role: 'pastor_general' | 'pastor' | 'admin' | 'secretary' | 'treasurer' | 'leader' | 'teacher' | 'reception' | 'user';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
  phone?: string | null;
}

const roleLabels: Record<string, string> = {
  pastor_general: "Pastor General",
  pastor: "Pastor",
  admin: "Administrador",
  secretary: "Secretario/a",
  treasurer: "Tesorero/a",
  leader: "Líder",
  teacher: "Maestro/a",
  reception: "Recepcionista",
  user: "Usuario",
};

const roleColors: Record<string, string> = {
  pastor_general: "bg-purple-100 text-purple-700 border-purple-200",
  pastor: "bg-indigo-100 text-indigo-700 border-indigo-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  secretary: "bg-amber-100 text-amber-700 border-amber-200",
  treasurer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  leader: "bg-orange-100 text-orange-700 border-orange-200",
  teacher: "bg-cyan-100 text-cyan-700 border-cyan-200",
  reception: "bg-pink-100 text-pink-700 border-pink-200",
  user: "bg-gray-100 text-gray-700 border-gray-200",
};

const defaultForm = {
  memberId: "",
  username: "",
  email: "",
  passwordHash: "",
  role: "user" as StaffMember['role'],
};

export default function RRHHPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [membersList, setMembersList] = useState<{ id: number; firstName: string; lastName: string }[]>([]);

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
        ...(roleFilter && { role: roleFilter }),
      });

      // Se consulta la API correcta (/api/rh)
      const [resStaff, resMembers] = await Promise.all([
        fetch(`/api/rh?${params}`),
        fetch('/api/members?limit=100')
      ]);

      if (!resStaff.ok) {
        throw new Error(`Error en el servidor (/api/rh): HTTP ${resStaff.status}`);
      }

      const dataStaff = await resStaff.json();
      const dataMembers = resMembers.ok ? await resMembers.json() : { data: [] };
      
      setStaff(dataStaff.staff || dataStaff.data || []);
      setKpis(dataStaff.kpis || { total: 0, active: 0, admins: 0 });
      setMembersList(dataMembers.data || dataMembers.members || []);
    } catch (e) {
      console.error("Error fetching HR data:", e);
      showToast("Error al cargar el personal de Recursos Humanos", "error");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/rh?id=${editingId}` : "/api/rh";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(`✅ Usuario ${editingId ? 'actualizado' : 'creado'} exitosamente`, 'success');
        setShowModal(false);
        setForm(defaultForm);
        setEditingId(null);
        fetchData();
      } else {
        const data = await res.json().catch(() => ({ error: 'Error inesperado' }));
        showToast(`❌ Error: ${data.error || 'Ocurrió un error'}`, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Error de conexión con el servidor", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (staffMember: StaffMember) => {
    setEditingId(staffMember.id);
    setForm({
      memberId: String(staffMember.memberId || ""),
      username: staffMember.username || "",
      email: staffMember.email || "",
      passwordHash: "",
      role: staffMember.role || "user",
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/rh?id=${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Usuario eliminado correctamente", 'success');
        fetchData();
      } else {
        showToast("❌ Error al eliminar el usuario", 'error');
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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Briefcase size={24} className="text-blue-600" />
            Recursos Humanos
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Gestiona el equipo pastoral, administrativo y de liderazgo
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setForm(defaultForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} /> Nuevo Usuario
        </button>
      </div>

      {/* KPIs SECTION - GLASSMORPHISM STYLE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Total Personal</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.total}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 text-white ring-4 ring-white/20">
                <Users size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider">Activos</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.active}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/25 text-white ring-4 ring-white/20">
                <UserCheck size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-800/60 uppercase tracking-wider">Administradores</p>
                <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : kpis.admins}</h4>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/25 text-white ring-4 ring-white/20">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card-premium p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o email..."
              className="input-field pl-9 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full sm:w-48 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {Object.entries(roleLabels).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
          <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center justify-center gap-1 py-2 px-3">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* TABLA DE PERSONAL */}
      <div className="card-premium overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Usuario</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-5 w-32" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-4 w-24" /></td>
                    <td><div className="skeleton h-6 w-16" /></td>
                    <td><div className="skeleton h-6 w-16" /></td>
                    <td><div className="skeleton h-6 w-12" /></td>
                  </tr>
                ))
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-medium">No hay personal registrado</p>
                    <p className="text-sm mt-1">Agrega el primer miembro del equipo usando el botón de arriba</p>
                  </td>
                </tr>
              ) : (
                staff.map((person) => {
                  const roleColor = roleColors[person.role] || "bg-gray-100 text-gray-700";
                  const initialFirst = person.firstName ? person.firstName.charAt(0) : "U";
                  const initialLast = person.lastName ? person.lastName.charAt(0) : "";

                  return (
                    <tr key={person.id} className="group hover:bg-gray-50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {initialFirst}{initialLast}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-800">{person.firstName || person.username} {person.lastName || ""}</p>
                            {person.memberId && <p className="text-xs text-gray-400">#{person.memberId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600 font-medium">@{person.username}</td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail size={12} /> {person.email}
                          </div>
                          {person.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone size={12} /> {person.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs border font-medium ${roleColor}`}>
                          {roleLabels[person.role] || person.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${person.isActive ? "badge-success" : "badge-danger"}`}>
                          {person.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(person)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteTarget(person.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR USUARIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? "Editar Usuario" : "Nuevo Usuario del Sistema"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Miembro Asociado *</label>
                  <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" required value={form.memberId} onChange={(e) => setForm({...form, memberId: e.target.value})}>
                    <option value="">Seleccionar miembro</option>
                    {membersList.map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Nombre de Usuario *</label>
                    <input className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" required value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} placeholder="ej. juan.pastor" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Correo Electrónico *</label>
                    <input type="email" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="ej. juan@iglesia.com" />
                  </div>
                </div>

                {!editingId && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Contraseña Temporal</label>
                    <input type="password" className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" value={form.passwordHash} onChange={(e) => setForm({...form, passwordHash: e.target.value})} placeholder="Mínimo 6 caracteres" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600">Rol / Permisos *</label>
                  <select className="input-field mt-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20" required value={form.role} onChange={(e) => setForm({...form, role: e.target.value as StaffMember['role']})}>
                    {Object.entries(roleLabels).map(([key, val]) => (
                      <option key={key} value={key}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving ? "Guardando..." : editingId ? "Actualizar Usuario" : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Usuario</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente este usuario del sistema. ¿Estás seguro?</p>
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