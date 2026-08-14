"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, Calendar, CheckCircle, XCircle, 
  Search, Plus, Filter, Download, Eye, Edit2, Trash2,
  BarChart2, TrendingUp, UserCheck, Clock, ChevronRight,
  RefreshCw, CalendarDays, User, X, MapPin, Check, AlertCircle,
  Trash, UserPlus, Info
} from "lucide-react";
import { formatDate, formatDateShort } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interfaces
interface AttendanceRecord {
  id: number;
  memberId: number | null;
  eventId: number | null;
  ministryId: number | null;
  attendanceDate: string;
  serviceType: string;
  isPresent: boolean;
  notes: string | null;
  createdAt: string;
  memberFirstName?: string;
  memberLastName?: string;
  memberPhotoUrl?: string | null;
}

interface Member { id: number; firstName: string; lastName: string; photoUrl: string | null; }
interface Visitor { id: number; firstName: string; lastName: string; photoUrl: string | null; }

interface StatsKPI {
  today: number;
  week: number;
  avgDaily: number;
  topMembers: { memberId: number; firstName: string; lastName: string; count: number }[];
  activeVisitors: number;
  chartData: { date: string; count: number }[];
}

export default function AsistenciaPage() {
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [visitorsList, setVisitorsList] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<StatsKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchMember, setSearchMember] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const [modalSearch, setModalSearch] = useState("");
  const [registeringId, setRegisteringId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ============================================================
  // 📄 EXPORTAR A PDF
  // ============================================================
  const handleExportPDF = () => {
    if (attendanceList.length === 0) {
      showToast("ℹ️ No hay registros de asistencia para exportar.", 'info');
      return;
    }

    const doc = new jsPDF();
    const title = `Reporte de Asistencia - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total de registros: ${attendanceList.length}`, 14, 28);

    const tableData = attendanceList.map((record) => {
      let name = record.memberFirstName && record.memberLastName 
        ? `${record.memberFirstName} ${record.memberLastName}` 
        : "—";
      const memberFound = membersList.find(m => m.id === record.memberId);
      if (!memberFound) {
        const visitorFound = visitorsList.find(v => v.id === record.memberId);
        if (visitorFound) name = `${visitorFound.firstName} ${visitorFound.lastName}`;
      }

      return [
        name,
        formatDate(record.attendanceDate),
        record.serviceType || "General",
        record.isPresent ? "Presente" : "Ausente",
        record.notes || "—"
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [["Persona", "Fecha", "Servicio / Evento", "Estado", "Notas"]],
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

    doc.save(`asistencia_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("✅ Reporte de asistencia exportado exitosamente", "success");
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", ...(searchFilter && { memberId: searchFilter }) });
      const resAtt = await fetch(`/api/attendance?${params}`);
      const dataAtt = await resAtt.json();
      setAttendanceList(dataAtt || []);

      const resStats = await fetch(`/api/attendance/stats`);
      const dataStats = await resStats.json();
      setStats(dataStats);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoading(false);
    }
  }, [searchFilter]);

  const fetchPeopleForModal = async () => {
    try {
      const [resMembers, resVisitors] = await Promise.all([
        fetch("/api/members?limit=100"),
        fetch("/api/visitors?limit=100")
      ]);
      const dataMembers = await resMembers.json();
      const dataVisitors = await resVisitors.json();
      setMembersList(dataMembers.data || []);
      setVisitorsList(dataVisitors.data || []);
    } catch (e) {
      console.error("Error fetching people for modal:", e);
    }
  };

  // 🔥 Cargamos miembros y visitantes también al entrar a la página (no solo
  // al abrir el modal), así el Historial Reciente muestra nombres correctos
  // desde el primer momento.
  useEffect(() => {
    fetchData();
    fetchPeopleForModal();
  }, [fetchData]);

  // ============================================================
  // HANDLE REGISTRO
  // ============================================================
  const handleRegisterAttendance = async (personId: number, personName: string, dateToUse: string, isVisitor: boolean = false) => {
    setRegisteringId(personId);
    try {
      const payload: any = { 
        memberId: personId, 
        attendanceDate: dateToUse,
        isPresent: true,
        serviceType: "general",
        notes: isVisitor ? "Visitante registrado" : "Miembro regular"
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchData();
        setModalSearch(""); 
        showToast(`✅ Asistencia registrada para ${personName}`, 'success');
      } else {
        const error = await res.json();
        showToast(`❌ Error: ${error.error || 'No se pudo registrar'}`, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión", 'error');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleMassRegister = () => {
    showToast("🚧 Registro Masivo en desarrollo.", 'info');
  };

  const handleDeleteAttendance = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/attendance?id=${confirmDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`✅ Registro eliminado.`, 'success');
        setConfirmDelete(null);
        await fetchData();
      } else {
        showToast(`❌ Error al eliminar.`, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error de conexión.", 'error');
    }
  };

  // Métricas y Cálculos
  const hoy = new Date().toISOString().split("T")[0];
  const asistenciasHoyReales = attendanceList.filter(a => 
    a.attendanceDate === hoy && a.isPresent
  ).length;

  // Lógica de Filtrado Unificada
  const filteredMembersForModal = membersList.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(modalSearch.toLowerCase())
  ).map(m => ({ ...m, type: 'member' }));

  const filteredVisitorsForModal = visitorsList.filter(v =>
    `${v.firstName} ${v.lastName}`.toLowerCase().includes(modalSearch.toLowerCase())
  ).map(v => ({ ...v, type: 'visitor' }));

  const combinedSearchResults = [...filteredMembersForModal, ...filteredVisitorsForModal].slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
          'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          {toast.type === 'success' && <Check size={20} className="text-green-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <UserCheck size={24} className="text-blue-600" />
            Gestión de Asistencia
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Registra, monitorea y analiza la asistencia de miembros y visitantes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar PDF
          </button>
          <button
            onClick={() => { 
              setShowRegisterModal(true); 
              setModalSearch(""); 
              setSelectedDate(new Date().toISOString().split("T")[0]);
              fetchPeopleForModal(); 
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> Registrar Asistencia
          </button>
        </div>
      </div>

      {/* KPIs MODERNOS (Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-premium p-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Asistencia Hoy</p>
              <h4 className="text-3xl font-bold text-blue-900 mt-1">{loading ? "..." : asistenciasHoyReales}</h4>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                <TrendingUp size={12} /> 
                <span>{asistenciasHoyReales > 0 ? "Activo" : "Sin registro"}</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="card-premium p-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Esta Semana</p>
              <h4 className="text-3xl font-bold text-emerald-600 mt-1">{loading ? "..." : stats?.week || 0}</h4>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Users size={12} /> Asistencias totales
              </div>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="card-premium p-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Promedio Diario</p>
              <h4 className="text-3xl font-bold text-purple-600 mt-1">
                {loading ? "..." : stats?.avgDaily ?? 0}
              </h4>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Clock size={12} /> Miembros por día
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
              <BarChart2 size={24} />
            </div>
          </div>
        </div>

        <div className="card-premium p-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Más Fiel</p>
              <h4 className="text-lg font-bold text-orange-600 mt-1 truncate max-w-[120px]">
                {loading || !stats?.topMembers || stats.topMembers.length === 0 
                  ? "—" 
                  : `${stats.topMembers[0].firstName} ${stats.topMembers[0].lastName}`}
              </h4>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <UserCheck size={12} /> {stats?.topMembers?.[0]?.count || 0} asistencias
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="card-premium p-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Visitantes Activos</p>
              <h4 className="text-3xl font-bold text-amber-600 mt-1">{loading ? "..." : stats?.activeVisitors ?? 0}</h4>
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                <UserPlus size={12} /> Potencial crecimiento
              </div>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <UserPlus size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO INTERACTIVO */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-500" />
            Tendencia Semanal
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Últimos 7 días
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => formatDateShort(val)}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`${value} asistencias`, 'Total']}
                labelFormatter={(label) => {
                  const dateStr = typeof label === 'string' ? label : '';
                  if (dateStr) {
                    const dateObj = new Date(dateStr + 'T00:00:00');
                    if (!isNaN(dateObj.getTime())) {
                       return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateObj);
                    }
                  }
                  return 'Fecha desconocida';
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                {stats?.chartData?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.count > 0 ? '#2563eb' : '#e5e7eb'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REGISTRO RÁPIDO */}
      <div className="card-premium p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-700">Registro Rápido</h3>
              <p className="text-xs text-gray-400">Busca un miembro o visitante y marca su asistencia</p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="input-field pl-9 bg-white border border-gray-200 w-full"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
            />
          </div>
        </div>

        {/* Resultados de búsqueda rápida */}
        {searchMember.length > 1 && (
          <div className="mt-4 max-h-60 overflow-y-auto border-t border-gray-100 pt-4 space-y-2">
            {loading ? (
              <div className="text-center text-sm text-gray-400 py-4">Buscando...</div>
            ) : (
              <>
                {[...membersList.filter(m => 
                  `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchMember.toLowerCase())
                ).map(m => ({ ...m, type: 'member' })), ...visitorsList.filter(v => 
                  `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchMember.toLowerCase())
                ).map(v => ({ ...v, type: 'visitor' }))].slice(0, 5).map((person: any) => {
                  
                  const isPresentToday = attendanceList.some(a => 
                    a.memberId === person.id && a.attendanceDate === hoy && a.isPresent
                  );

                  return (
                    <div key={`${person.type}-${person.id}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${person.type === 'visitor' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                          {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">{person.firstName} {person.lastName}</p>
                          <p className="text-xs text-gray-500">
                            {person.type === 'visitor' ? '👤 Visitante' : '✅ Miembro'} • 
                            {isPresentToday ? " Ya presente hoy" : " Ausente hoy"}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRegisterAttendance(person.id, `${person.firstName} ${person.lastName}`, hoy, person.type === 'visitor')}
                        disabled={registeringId === person.id}
                        className={`text-xs py-1 px-4 h-8 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg ${
                          isPresentToday 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                            : 'btn-primary'
                        }`}
                      >
                        {registeringId === person.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : isPresentToday ? (
                          <Check size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                        {registeringId === person.id ? "Guardando..." : isPresentToday ? "Re-marcar" : "Marcar Hoy"}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* LISTADO DE ASISTENCIA (Tabla) */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <CalendarDays size={16} />
            Historial Reciente
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{attendanceList.length}</span>
          </h3>
          <div className="flex gap-2">
            <button className="btn-outline text-xs flex items-center gap-1 py-1 px-3">
              <Filter size={12} /> Filtrar
            </button>
            <button onClick={() => fetchData()} className="btn-outline text-xs flex items-center gap-1 py-1 px-3">
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Fecha</th>
                <th>Servicio / Evento</th>
                <th>Estado</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-5 w-32" /></td>
                    <td><div className="skeleton h-4 w-24" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-6 w-16" /></td>
                    <td><div className="skeleton h-4 w-10" /></td>
                    <td><div className="skeleton h-6 w-12" /></td>
                  </tr>
                ))
              ) : attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-gray-200" />
                    No hay registros de asistencia aún.
                  </td>
                </tr>
              ) : (
                attendanceList.map((record: any) => {
                  const foundMember = membersList.find(m => m.id === record.memberId);
                  const foundVisitor = visitorsList.find(v => v.id === record.memberId);
                  
                  let displayName = "Desconocido";
                  let personType = 'member';

                  if (foundMember) {
                    displayName = `${foundMember.firstName} ${foundMember.lastName}`;
                    personType = 'member';
                  } else if (foundVisitor) {
                    displayName = `${foundVisitor.firstName} ${foundVisitor.lastName}`;
                    personType = 'visitor';
                  }

                  return (
                    <tr key={record.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="font-medium text-sm text-gray-800 flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          {personType === 'visitor' ? (
                            <UserPlus size={14} className="text-amber-500" />
                          ) : (
                            <UserCheck size={14} className="text-blue-500" />
                          )}
                          {displayName}
                        </div>
                      </td>
                      <td className="text-sm text-gray-500">
                        {(() => {
                          const dateVal = record.attendanceDate as unknown as string;
                          return dateVal ? formatDate(dateVal) : '—';
                        })()}
                      </td>
                      <td className="text-sm text-gray-500 capitalize">{record.serviceType || "General"}</td>
                      <td>
                        <span className={`badge ${record.isPresent ? "badge-success" : "badge-danger"}`}>
                          {record.isPresent ? "Presente" : "Ausente"}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500 max-w-[150px] truncate">
                        {personType === 'visitor' ? 'Visitante' : (record.notes || '—')}
                      </td>
                      <td>
                        <button 
                          onClick={() => setConfirmDelete({ id: record.id, name: displayName })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO DE ASISTENCIA CON SELECCIÓN DE FECHA */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRegisterModal(false)}>
          <div className="modal-content max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck size={20} className="text-blue-500" />
                  Registrar Asistencia
                </h3>
                <button onClick={() => setShowRegisterModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                
                {/* SELECTOR DE FECHA */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Fecha de Asistencia 📅
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      className="input-field pl-9 bg-white border border-gray-200 w-full"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Buscador */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Buscar Miembro o Visitante
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-9 bg-white border border-gray-200 w-full"
                      placeholder="Escribe el nombre..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista de resultados */}
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                  {modalSearch.length > 0 ? (
                    combinedSearchResults.map((person: any) => {
                      const alreadyRegisteredToday = attendanceList.some(a => 
                        a.memberId === person.id && a.attendanceDate === selectedDate && a.isPresent
                      );

                      return (
                        <div key={`${person.type}-${person.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${person.type === 'visitor' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                              {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-800">{person.firstName} {person.lastName}</p>
                              <p className={`text-xs ${person.type === 'visitor' ? 'text-amber-600' : 'text-blue-600'}`}>
                                {person.type === 'visitor' ? '👤 Visitante' : '✅ Miembro'} • 
                                {alreadyRegisteredToday ? " Ya marcado en esta fecha" : " Sin marcar"}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRegisterAttendance(person.id, `${person.firstName} ${person.lastName}`, selectedDate, person.type === 'visitor')}
                            disabled={registeringId === person.id}
                            className={`text-xs py-1 px-3 h-7 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg ${
                              alreadyRegisteredToday 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                : 'btn-primary'
                            }`}
                          >
                            {registeringId === person.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : alreadyRegisteredToday ? (
                              <Check size={12} />
                            ) : (
                              <Check size={12} />
                            )}
                            {registeringId === person.id ? "Guardando..." : alreadyRegisteredToday ? "Re-marcar" : "Marcar"}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-400">
                      {modalSearch.length === 0 ? "Busca un miembro o visitante." : "No se encontraron coincidencias."}
                    </div>
                  )}
                </div>

                {/* Botones inferiores */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 mt-2">
                  <button 
                    onClick={handleMassRegister}
                    className="btn-outline text-sm w-full flex items-center justify-center gap-2 py-2"
                  >
                    <Plus size={14} />
                    Registro Masivo (Próximamente)
                  </button>
                  <button onClick={() => setShowRegisterModal(false)} className="btn-primary text-sm w-full py-2">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar Registro?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Estás a punto de eliminar el registro de asistencia de <span className="font-bold text-gray-700">{confirmDelete.name}</span>. 
              <br/><span className="text-xs text-red-400">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAttendance}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md transition-colors"
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