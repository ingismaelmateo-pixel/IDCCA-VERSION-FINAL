"use client";

import { useEffect, useState, useCallback } from "react";
// 1. Importas los modales aquí 👇
import EnrollStudentsModal from "@/components/EnrollStudentsModal";
import TakeAttendanceModal from "@/components/TakeAttendanceModal";
import {
  BookOpen, Plus, X, Check, Users, Calendar, Target,
  Search, Filter, Download, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, Camera, GraduationCap,
  Clock, Award, TrendingUp, UserPlus, UserCheck,
  Mail, Phone, MapPin, BarChart3, FileText,
  ClipboardCheck, Settings, MoreVertical, AlertCircle,
  Star, Trophy, Book, Library, Layers, Sparkles,
  ChevronDown, ExternalLink, Printer, FileSpreadsheet, FileDown,
  CheckCircle, XCircle, Clock as ClockIcon,
  Heart, Cross, Church, Users as UsersIcon,
  Calendar as CalendarIcon, Home, MessageCircle
} from "lucide-react";
import { formatDate, getInitials, formatDateShort } from "@/lib/utils";
// 📦 IMPORTAMOS LAS LIBRERÍAS DE PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interfaces
interface BibleCourse {
  id: number;
  name: string;
  description: string;
  category: string;
  level: string;
  teacherId: number | null;
  teacherName: string | null;
  schedule: string;
  scheduleDay: string;
  scheduleTime: string;
  duration: string;
  maxStudents: number;
  currentStudents: number;
  startDate: string;
  endDate: string;
  status: string;
  requirements: string;
  syllabus: string;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseFormData {
  name: string;
  description: string;
  category: string;
  level: string;
  teacherId: string;
  scheduleDay: string;
  scheduleTime: string;
  duration: string;
  maxStudents: string;
  startDate: string;
  endDate: string;
  status: string;
  requirements: string;
  syllabus: string;
  photoUrl: string;
  photoFile?: File;
}

// Constantes para Escuela Bíblica de Iglesia
const bibleCategories = [
  { value: 'doctrina', label: '📖 Doctrina Cristiana', icon: BookOpen },
  { value: 'antiguo_testamento', label: '📜 Antiguo Testamento', icon: Book },
  { value: 'nuevo_testamento', label: '✝️ Nuevo Testamento', icon: Cross },
  { value: 'profecia', label: '🔮 Profecía', icon: Star },
  { value: 'vida_cristiana', label: '❤️ Vida Cristiana', icon: Heart },
  { value: 'discipulado', label: '👥 Discipulado', icon: UsersIcon },
  { value: 'oracion', label: '🙏 Oración', icon: Heart },
  { value: 'ministerio', label: '🏛️ Ministerio', icon: Church },
];

const bibleLevels = [
  { value: 'principiante', label: '🌱 Principiante', color: 'bg-green-100 text-green-700' },
  { value: 'intermedio', label: '🌿 Intermedio', color: 'bg-blue-100 text-blue-700' },
  { value: 'avanzado', label: '🌳 Avanzado', color: 'bg-purple-100 text-purple-700' },
];

const scheduleDays = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
];

const statusColors: Record<string, string> = {
  active: "badge-success",
  completed: "badge-info",
  cancelled: "badge-danger",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

const defaultForm: CourseFormData = {
  name: "",
  description: "",
  category: "",
  level: "",
  teacherId: "",
  scheduleDay: "",
  scheduleTime: "",
  duration: "",
  maxStudents: "30",
  startDate: "",
  endDate: "",
  status: "active",
  requirements: "",
  syllabus: "",
  photoUrl: "",
};

export default function BibleSchool() {
  const [courses, setCourses] = useState<BibleCourse[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Estados para controlar los modales de Inscripción y Asistencia
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<BibleCourse | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<BibleCourse | null>(null);
  const [form, setForm] = useState<CourseFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 🆕 NUEVOS ESTADOS: Modal de confirmación y Toast
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Cargar cursos
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        search,
        ...(categoryFilter && { category: categoryFilter }),
        ...(levelFilter && { level: levelFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/bible-school/courses?${params}`);
      const data = await res.json();
      setCourses(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, levelFilter, statusFilter]);

  // Cargar miembros para profesores
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
    fetchCourses();
    fetchMembers();
  }, [fetchCourses, fetchMembers]);

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
      const url = editingId ? `/api/bible-school/courses/${editingId}` : "/api/bible-school/courses";
      
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
          fetchCourses();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: BibleCourse) => {
    setEditingId(course.id);
    setForm({
      name: course.name || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "",
      teacherId: course.teacherId?.toString() || "",
      scheduleDay: course.scheduleDay || "",
      scheduleTime: course.scheduleTime || "",
      duration: course.duration || "",
      maxStudents: course.maxStudents?.toString() || "30",
      startDate: course.startDate || "",
      endDate: course.endDate || "",
      status: course.status || "active",
      requirements: course.requirements || "",
      syllabus: course.syllabus || "",
      photoUrl: course.photoUrl || "",
    });
    setShowModal(true);
  };

  // 🆕 NUEVA FUNCIÓN: Manejar la eliminación con el modal interactivo
  const handleConfirmDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/bible-school/courses/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        showToast("🗑️ Curso bíblico eliminado correctamente", 'success');
        fetchCourses();
      } else {
        showToast("❌ Error al eliminar el curso", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", 'error');
    }
  };

  // 📄 NUEVA FUNCIÓN: Exportar a PDF
  const handleExportPDF = () => {
    if (courses.length === 0) {
      showToast("ℹ️ No hay cursos para exportar.", 'error');
      return;
    }

    const doc = new jsPDF();
    const title = `Escuela Bíblica - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total: ${courses.length} cursos`, 14, 28);

    const tableData = courses.map((c) => [
      c.name,
      bibleCategories.find(cat => cat.value === c.category)?.label || c.category || "—",
      bibleLevels.find(l => l.value === c.level)?.label || c.level || "—",
      c.teacherName || "—",
      c.scheduleDay && c.scheduleTime ? `${scheduleDays.find(d => d.value === c.scheduleDay)?.label || c.scheduleDay} ${c.scheduleTime}` : "—",
      c.currentStudents || 0
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Curso", "Categoría", "Nivel", "Maestro", "Horario", "Estudiantes"]],
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

    doc.save(`escuela_biblica_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("✅ Reporte de cursos exportado exitosamente", "success");
  };

  // Calcular KPIs
  const totalCourses = total;
  const activeCourses = courses.filter(c => c.status === 'active').length;
  const totalStudents = courses.reduce((acc, c) => acc + (c.currentStudents || 0), 0);
  const avgStudents = totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0;

  return (
    <div className="space-y-6">
      
      {/* 🆕 TOAST NOTIFICATION */}
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
            <BookOpen size={24} className="text-blue-600" />
            Escuela Bíblica
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {total} cursos bíblicos • {totalStudents} estudiantes • {activeCourses} cursos activos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar PDF
          </button>
          <button
            onClick={() => { setShowModal(true); setForm(defaultForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Nuevo Curso Bíblico
          </button>
        </div>
      </div>

      {/* KPIs Espirituales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-blue-900">{totalCourses}</p>
          <p className="text-xs text-gray-400">Cursos Bíblicos</p>
          <div className="mt-1 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-green-600">{totalStudents}</p>
          <p className="text-xs text-gray-400">Estudiantes</p>
          <div className="mt-1 h-1 w-full bg-green-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full" style={{ width: `${Math.min((totalStudents / (totalCourses * 30)) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
              <Church size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-purple-600">{activeCourses}</p>
          <p className="text-xs text-gray-400">Cursos Activos</p>
          <div className="mt-1 h-1 w-full bg-purple-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${(activeCourses / totalCourses) * 100}%` }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
              <GraduationCap size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-orange-600">{avgStudents}</p>
          <p className="text-xs text-gray-400">Promedio por Curso</p>
          <div className="mt-1 h-1 w-full bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-600 rounded-full" style={{ width: `${Math.min(avgStudents * 3, 100)}%` }} />
          </div>
        </div>

        <div className="card-premium p-3 text-center hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center mb-1">
            <div className="p-2 rounded-full bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
              <Heart size={18} />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600">✝️</p>
          <p className="text-xs text-gray-400">Formación Espiritual</p>
          <div className="mt-1 h-1 w-full bg-red-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 rounded-full" style={{ width: '100%' }} />
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
              placeholder="Buscar curso bíblico..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field w-40"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todas las categorías</option>
            {bibleCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            className="input-field w-40"
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos los niveles</option>
            {bibleLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          <select
            className="input-field w-40"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers size={15} className="inline mr-1" />
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 size={15} className="inline mr-1" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
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
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No hay cursos bíblicos registrados</p>
              <p className="text-gray-300 text-sm mt-1">Comienza un nuevo curso para la formación espiritual</p>
            </div>
          ) : (
            courses.map((course) => {
              const categoryInfo = bibleCategories.find(c => c.value === course.category);
              const levelInfo = bibleLevels.find(l => l.value === course.level);
              const CategoryIcon = categoryInfo?.icon || BookOpen;
              const scheduleDay = scheduleDays.find(d => d.value === course.scheduleDay);

              return (
                <div key={course.id} className="card-premium p-4 hover:shadow-xl transition-all group border-2 border-transparent hover:border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {course.photoUrl ? (
                          <img 
                            src={course.photoUrl} 
                            alt={course.name}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                            <BookOpen size={28} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                          {course.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          <CategoryIcon size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {categoryInfo?.label || "Sin categoría"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${statusColors[course.status] || "badge-info"} text-xs`}>
                      {statusLabels[course.status] || course.status}
                    </span>
                  </div>

                  {/* Información */}
                  <div className="space-y-1.5 mb-3">
                    {course.teacherName && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <UserCheck size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">Maestro: {course.teacherName}</span>
                      </div>
                    )}
                    {levelInfo && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <GraduationCap size={12} className="text-gray-400 flex-shrink-0" />
                        <span className={`px-2 py-0.5 rounded-full text-xs ${levelInfo.color}`}>
                          {levelInfo.label}
                        </span>
                      </div>
                    )}
                    {scheduleDay && course.scheduleTime && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                        <span>{scheduleDay.label} {course.scheduleTime}</span>
                        {course.duration && <span className="text-gray-400">• {course.duration}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Users size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{course.currentStudents || 0} / {course.maxStudents} estudiantes</span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {course.maxStudents > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Capacidad</span>
                        <span>{Math.round(((course.currentStudents || 0) / course.maxStudents) * 100)}%</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div 
                          className="progress-fill bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${Math.min(((course.currentStudents || 0) / course.maxStudents) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* 🔥 ACCIONES ACTUALIZADAS CON LOS BOTONES DE INSCRIPCIÓN Y ASISTENCIA */}
                  <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    {/* BOTÓN INSCRIBIR */}
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowEnrollModal(true);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <UserPlus size={13} />
                      Inscribir
                    </button>

                    {/* BOTÓN ASISTENCIA */}
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowAttendanceModal(true);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <ClipboardCheck size={13} />
                      Asistencia
                    </button>

                    <button
                      onClick={() => setShowDetail(course)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleEdit(course)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(course.id)}
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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Curso Bíblico</th>
                  <th>Categoría</th>
                  <th>Nivel</th>
                  <th>Maestro</th>
                  <th>Horario</th>
                  <th>Estudiantes</th>
                  <th>Estado</th>
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
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <BookOpen size={48} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 font-medium">No hay cursos bíblicos registrados</p>
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => {
                    const categoryInfo = bibleCategories.find(c => c.value === course.category);
                    const levelInfo = bibleLevels.find(l => l.value === course.level);
                    const scheduleDay = scheduleDays.find(d => d.value === course.scheduleDay);

                    return (
                      <tr key={course.id} className="group">
                        <td>
                          <div className="flex items-center gap-2">
                            {course.photoUrl ? (
                              <img 
                                src={course.photoUrl} 
                                alt={course.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                                <BookOpen size={16} />
                              </div>
                            )}
                            <span className="font-medium text-sm">{course.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-gray-500">{categoryInfo?.label || "—"}</span>
                        </td>
                        <td>
                          {levelInfo && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${levelInfo.color}`}>
                              {levelInfo.label}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">{course.teacherName || "Sin maestro"}</span>
                        </td>
                        <td>
                          <span className="text-xs text-gray-500">
                            {scheduleDay ? `${scheduleDay.label} ${course.scheduleTime || ''}` : "—"}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">{course.currentStudents || 0}</span>
                        </td>
                        <td>
                          <span className={`badge ${statusColors[course.status] || "badge-info"}`}>
                            {statusLabels[course.status] || course.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            
                            {/* 🔥 BOTONES EN VISTA LISTA */}
                            <button
                              onClick={() => {
                                setSelectedCourse(course);
                                setShowEnrollModal(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <UserPlus size={12} />
                              Inscribir
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCourse(course);
                                setShowAttendanceModal(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <ClipboardCheck size={12} />
                              Asistencia
                            </button>

                            <button
                              onClick={() => setShowDetail(course)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(course)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(course.id)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Mostrando {courses.length} de {total} cursos</p>
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

         {/* 🔥 MODAL DE INSCRIPCIÓN - CORREGIDO */}
      {showEnrollModal && selectedCourse && (
        <EnrollStudentsModal
          isOpen={showEnrollModal}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          availableMembers={members} // Le pasamos la lista de miembros cargada
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => {
            fetchCourses();
          }}
        />
      )}

      {/* 🔥 MODAL DE ASISTENCIA - CORREGIDO */}
      {showAttendanceModal && selectedCourse && (
        <TakeAttendanceModal
          isOpen={showAttendanceModal}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          students={members} // Le pasamos la lista de miembros cargada
          onClose={() => setShowAttendanceModal(false)}
          onSuccess={() => {
            // Opcional: Recargar algo si es necesario
            fetchCourses();
          }}
        />
      )}

      {/* Modal de formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content max-w-3xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                <BookOpen size={20} />
                {editingId ? "Editar Curso Bíblico" : "Nuevo Curso Bíblico"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {success && (
                <div className="alert alert-success">
                  <Check size={16} />
                  <span className="text-sm font-medium">¡Curso bíblico guardado exitosamente!</span>
                </div>
              )}

              {/* Imagen */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera size={14} /> Imagen del Curso
                </h4>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {form.photoUrl ? (
                      <img 
                        src={form.photoUrl} 
                        alt="Imagen del curso"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl">
                        <BookOpen size={32} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById('course-photo-upload')?.click()}
                      className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      id="course-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-gray-500">
                      Sube una imagen representativa del curso
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Formatos: JPG, PNG • Máx: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Información Básica */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen size={14} /> Información del Curso
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del Curso *</label>
                    <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fundamentos de la Fe" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                    <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe el propósito y contenido del curso..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                    <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">Seleccionar categoría</option>
                      {bibleCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nivel</label>
                    <select className="input-field" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                      <option value="">Seleccionar nivel</option>
                      {bibleLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Maestro</label>
                    <select className="input-field" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                      <option value="">Seleccionar maestro</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Activo</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Horario */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={14} /> Horario
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Día</label>
                    <select className="input-field" value={form.scheduleDay} onChange={(e) => setForm({ ...form, scheduleDay: e.target.value })}>
                      <option value="">Seleccionar día</option>
                      {scheduleDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hora</label>
                    <input type="time" className="input-field" value={form.scheduleTime} onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Duración</label>
                    <input className="input-field" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Ej: 8 semanas, 3 meses" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Capacidad Máxima</label>
                    <input type="number" className="input-field" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} placeholder="30" />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Inicio</label>
                  <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Finalización</label>
                  <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="divider" />

              {/* Contenido */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText size={14} /> Contenido
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Requisitos</label>
                    <textarea className="input-field resize-none" rows={2} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Requisitos para tomar el curso..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Plan de Estudios</label>
                    <textarea className="input-field resize-none" rows={3} value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })} placeholder="Temas y lecciones del curso..." />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Curso"}
                </button>
              </div>
            </form>
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
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                      <BookOpen size={32} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{showDetail.name}</h3>
                    <span className={`badge ${statusColors[showDetail.status] || "badge-info"}`}>
                      {statusLabels[showDetail.status] || showDetail.status}
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
                    <p className="text-xs text-gray-400 mb-0.5">Categoría</p>
                    <p className="font-medium text-sm text-gray-800">
                      {bibleCategories.find(c => c.value === showDetail.category)?.label || showDetail.category || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Nivel</p>
                    <p className="font-medium text-sm text-gray-800">
                      {bibleLevels.find(l => l.value === showDetail.level)?.label || showDetail.level || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Maestro</p>
                    <p className="font-medium text-sm text-gray-800">{showDetail.teacherName || "Sin asignar"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Estudiantes</p>
                    <p className="font-medium text-sm text-gray-800">{showDetail.currentStudents || 0} / {showDetail.maxStudents || 0}</p>
                  </div>
                </div>

                {showDetail.description && (
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Descripción</p>
                    <p className="text-sm text-gray-700">{showDetail.description}</p>
                  </div>
                )}

                {(showDetail.scheduleDay || showDetail.scheduleTime) && (
                  <div className="p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-gray-400 mb-2">Horario</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={14} className="text-blue-500" />
                        <span>
                          {scheduleDays.find(d => d.value === showDetail.scheduleDay)?.label || showDetail.scheduleDay}
                          {showDetail.scheduleTime && ` a las ${showDetail.scheduleTime}`}
                        </span>
                        {showDetail.duration && (
                          <span className="text-xs text-gray-500">({showDetail.duration})</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {showDetail.requirements && (
                  <div className="p-3 rounded-xl bg-yellow-50">
                    <p className="text-xs text-gray-400 mb-1">Requisitos</p>
                    <p className="text-sm text-gray-700">{showDetail.requirements}</p>
                  </div>
                )}

                {showDetail.syllabus && (
                  <div className="p-3 rounded-xl bg-green-50">
                    <p className="text-xs text-gray-400 mb-1">Plan de Estudios</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{showDetail.syllabus}</p>
                  </div>
                )}

                <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  Creado: {formatDate(showDetail.createdAt)}
                  {showDetail.updatedAt && ` • Actualizado: ${formatDate(showDetail.updatedAt)}`}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => { setShowDetail(null); handleEdit(showDetail); }} className="btn-primary flex-1">Editar Curso</button>
                <button onClick={() => setShowDetail(null)} className="btn-outline flex-1">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NUEVO: MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Curso Bíblico</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente este curso bíblico de la base de datos.
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