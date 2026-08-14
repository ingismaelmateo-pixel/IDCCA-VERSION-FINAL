"use client";

import { useState, useEffect } from "react";
import { 
  Users, Plus, X, Calendar, Trash2, RefreshCw, Baby, Heart, 
  Phone, AlertCircle, Check, User, Clock, ChevronRight,
  UserPlus, TrendingUp, Award, Eye, Edit2, Search
} from "lucide-react";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  photoUrl?: string;
  parentId?: number | null;
  parentName?: string;
  phone?: string;
  address?: string;
  grade?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  cellPhone: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  attendanceDate: string;
  isPresent: boolean;
  notes?: string;
}

export default function SundaySchool() {
  const [students, setStudents] = useState<Student[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, attendanceToday: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Formulario para nuevo niño
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    parentId: "",
    phone: "",
    address: "",
    grade: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: ""
  });

  // Asistencia
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<{ studentId: number; present: boolean }[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sunday-school");
      const data = await res.json();
      setStudents(data.students || []);
      setKpis(data.kpis || { total: 0, active: 0, attendanceToday: 0 });
    } catch (e) {
      console.error(e);
      showToast("❌ Error al cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members?limit=100");
      const data = await res.json();
      setMembers(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/sunday-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: 'registerStudent', 
          ...form,
          parentId: form.parentId ? Number(form.parentId) : null
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          firstName: "", lastName: "", birthDate: "", parentId: "",
          phone: "", address: "", grade: "", allergies: "",
          emergencyContact: "", emergencyPhone: ""
        });
        showToast("✅ Niño registrado exitosamente", "success");
        fetchData();
      } else {
        const error = await res.json();
        showToast(`❌ ${error.error || 'Error al registrar'}`, "error");
      }
    } catch (e) { 
      console.error(e); 
      showToast("❌ Error de conexión", "error");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await fetch(`/api/sunday-school/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteModal(null);
        showToast("✅ Niño eliminado correctamente", "success");
        fetchData();
      } else {
        const error = await res.json();
        showToast(`❌ ${error.error || 'Error al eliminar'}`, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", "error");
    }
  };

  const handleOpenAttendance = () => {
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceList(students.map(s => ({ studentId: s.id, present: false })));
    setShowAttendanceModal(true);
  };

  const handleAttendanceChange = (studentId: number, present: boolean) => {
    setAttendanceList(prev => 
      prev.map(item => 
        item.studentId === studentId ? { ...item, present } : item
      )
    );
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const res = await fetch("/api/sunday-school/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: attendanceDate,
          attendance: attendanceList
        }),
      });

      if (res.ok) {
        setShowAttendanceModal(false);
        showToast("✅ Asistencia guardada correctamente", "success");
        fetchData();
      } else {
        const error = await res.json();
        showToast(`❌ ${error.error || 'Error al guardar'}`, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", "error");
    } finally {
      setSavingAttendance(false);
    }
  };

  // Edad en años
  const calculateAge = (birthDate: string) => {
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const getParentName = (parentId: number | null | undefined) => {
    if (!parentId) return "—";
    const member = members.find(m => m.id === parentId);
    return member ? `${member.firstName} ${member.lastName}` : `ID: ${parentId}`;
  };

  return (
    <div className="space-y-6 pb-12">

      {/* TOAST */}
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
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Baby size={24} className="text-blue-600" />
            Escuela Dominical
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Gestión de niños, asistencia y cuidado pastoral.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenAttendance} 
            className="btn-outline text-sm flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
          >
            <Calendar size={15} /> Tomar Asistencia
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo Niño
          </button>
        </div>
      </div>

      {/* KPIs MEJORADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Niños */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-200/50 p-6 group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Niños</p>
              <p className="text-4xl font-bold text-white mt-1">{kpis.total}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-center gap-1 text-blue-100 text-xs">
            <span className="opacity-75">Registrados en el sistema</span>
          </div>
        </div>

        {/* Activos */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-200/50 p-6 group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium uppercase tracking-wider">Activos</p>
              <p className="text-4xl font-bold text-white mt-1">{kpis.active}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Heart size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-center gap-1 text-green-100 text-xs">
            <span className="opacity-75">Niños activos</span>
          </div>
        </div>

        {/* Asistencia Hoy */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-200/50 p-6 group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">Asistencia Hoy</p>
              <p className="text-4xl font-bold text-white mt-1">{kpis.attendanceToday}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calendar size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-center gap-1 text-purple-100 text-xs">
            <span className="opacity-75">Presentes hoy</span>
          </div>
        </div>
      </div>

      {/* Lista de Niños */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Baby size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-500">Aún no hay niños registrados</p>
            <p className="text-sm mt-1">Agrega el primer niño a la Escuela Dominical.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex">Agregar Niño</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Edad</th>
                  <th>Grado</th>
                  <th>Padre/Madre</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.firstName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                            {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                          </div>
                        )}
                        <span>{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td className="text-gray-500">{calculateAge(s.birthDate)} años</td>
                    <td className="text-gray-500">{s.grade || "—"}</td>
                    <td className="text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        <span>{getParentName(s.parentId)}</span>
                      </div>
                    </td>
                    <td className="text-gray-500">
                      {s.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          <span>{s.phone}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setShowDeleteModal(s.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nuevo Niño MEJORADO */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={20} className="text-blue-600" />
                Registrar Nuevo Niño
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre *</label>
                  <input 
                    className="input-field" 
                    required 
                    value={form.firstName} 
                    onChange={e => setForm({...form, firstName: e.target.value})} 
                    placeholder="Nombre del niño"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido *</label>
                  <input 
                    className="input-field" 
                    required 
                    value={form.lastName} 
                    onChange={e => setForm({...form, lastName: e.target.value})} 
                    placeholder="Apellido del niño"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Nacimiento *</label>
                <input 
                  type="date" 
                  className="input-field" 
                  required 
                  value={form.birthDate} 
                  onChange={e => setForm({...form, birthDate: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Grado / Nivel</label>
                <input 
                  className="input-field" 
                  value={form.grade} 
                  onChange={e => setForm({...form, grade: e.target.value})} 
                  placeholder="Ej: Pre-Kinder, 1ro de Primaria..."
                />
              </div>

              {/* ✅ CAMPO MEJORADO: SELECT de miembros en lugar de ID manual */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Padre/Madre</label>
                <select 
                  className="input-field" 
                  value={form.parentId} 
                  onChange={e => setForm({...form, parentId: e.target.value})}
                >
                  <option value="">Seleccionar padre/madre</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} {member.email ? `(${member.email})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {members.length === 0 ? "⚠️ No hay miembros registrados. Crea un miembro primero." : "Selecciona un miembro de la lista"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                <input 
                  className="input-field" 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  placeholder="Teléfono de contacto" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Alergias o Cuidados Especiales</label>
                <textarea 
                  className="input-field" 
                  rows={2} 
                  value={form.allergies} 
                  onChange={e => setForm({...form, allergies: e.target.value})} 
                  placeholder="Ej: Alergia al polen, asma, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Contacto de Emergencia</label>
                <input 
                  className="input-field" 
                  value={form.emergencyContact} 
                  onChange={e => setForm({...form, emergencyContact: e.target.value})} 
                  placeholder="Nombre del contacto" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono de Emergencia</label>
                <input 
                  className="input-field" 
                  value={form.emergencyPhone} 
                  onChange={e => setForm({...form, emergencyPhone: e.target.value})} 
                  placeholder="Teléfono de emergencia" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Niño</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE ASISTENCIA */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAttendanceModal(false)}>
          <div className="modal-content max-w-2xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-purple-600" />
                <h3 className="font-bold text-lg text-gray-900">Tomar Asistencia</h3>
              </div>
              <button 
                onClick={() => setShowAttendanceModal(false)} 
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                <input 
                  type="date" 
                  className="input-field max-w-xs" 
                  value={attendanceDate} 
                  onChange={e => setAttendanceDate(e.target.value)} 
                />
              </div>

              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No hay niños registrados para tomar asistencia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {students.map(student => {
                    const attendance = attendanceList.find(a => a.studentId === student.id);
                    return (
                      <label
                        key={student.id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          attendance?.present 
                            ? 'border-green-500 bg-green-50/80' 
                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 accent-green-600 cursor-pointer mr-4"
                          checked={attendance?.present || false}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-800">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {student.grade || "Sin grado"} • {calculateAge(student.birthDate)} años
                              </p>
                            </div>
                          </div>
                        </div>
                        {attendance?.present && (
                          <Check size={18} className="text-green-600 shrink-0 ml-2" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingAttendance || students.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {savingAttendance ? "Guardando..." : <><Check size={16} /> Guardar Asistencia</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Niño</h3>
            <p className="text-sm text-gray-500 mb-2">
              ¿Estás seguro de eliminar este niño de la Escuela Dominical?
            </p>
            <p className="text-xs text-red-400 mb-6">
              ⚠️ Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteStudent(showDeleteModal)}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md"
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