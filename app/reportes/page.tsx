"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  BarChart2, Calendar, TrendingUp, TrendingDown, 
  Users, UserPlus, Heart, BookOpen, 
  Download, RefreshCw, Globe, Settings
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReportData {
  period: string;
  dateRange: { start: string; end: string };
  data: {
    attendance: number;
    income: number;
    expense: number;
    events: number;
    counseling: number;
    pastoral: number;
    newMembers: number;
    newVisitors: number;
  };
}

const periodLabels: Record<string, string> = {
  week: "Semanal",
  quincena: "Quincenal",
  month: "Mensual",
  year: "Anual",
};

export default function ReportesGlobalesPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/global?period=${selectedPeriod}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error("Error fetching global report:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Función para exportar los datos como JSON (fácilmente convertible a CSV/PDF en el futuro)
  const handleExport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${report.period}_${report.dateRange.start}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <BarChart2 size={24} className="text-blue-600" />
            Reportes Globales
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Visualiza el estado general de la iglesia en el período seleccionado
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            className="input-field w-40 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">Semanal</option>
            <option value="quincena">Quincenal</option>
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </select>
          <button onClick={handleExport} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar JSON
          </button>
        </div>
      </div>

      {/* RANGO DE FECHAS */}
      {report && !loading && (
        <div className="card-premium p-3 bg-blue-50/50 border border-blue-100 flex items-center gap-2 text-sm text-blue-700">
          <Calendar size={16} />
          <span className="font-medium">Período {periodLabels[selectedPeriod]}:</span>
          <span>{formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}</span>
        </div>
      )}

      {/* GRID DE KPIs GLOBALES */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-24 animate-pulse bg-white/80" />
          ))}
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Asistencia */}
          <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Asistencia</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{report.data.attendance}</h4>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 text-white ring-4 ring-white/20">
                  <Users size={22} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Finanzas (Balance) */}
          <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider">Ingresos</p>
                  <h4 className="text-2xl font-bold text-green-600 mt-1 tracking-tight">${report.data.income.toLocaleString()}</h4>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/25 text-white ring-4 ring-white/20">
                  <TrendingUp size={22} strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Gastos:</span>
                <span className="text-red-600 font-semibold">${report.data.expense.toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs font-bold text-gray-700 border-t border-gray-200 pt-1">
                <span>Balance:</span>
                <span className={`${report.data.income - report.data.expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${(report.data.income - report.data.expense).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Eventos y Actividades */}
          <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-800/60 uppercase tracking-wider">Eventos</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{report.data.events}</h4>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/25 text-white ring-4 ring-white/20">
                  <Calendar size={22} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Consejería y Visitas */}
          <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-pink-800/60 uppercase tracking-wider">Consejería</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{report.data.counseling}</h4>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-500/25 text-white ring-4 ring-white/20">
                  <Heart size={22} strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span>Visitas Pastorales:</span>
                <span className="font-bold text-gray-700">{report.data.pastoral}</span>
              </div>
            </div>
          </div>

          {/* Crecimiento */}
          <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 col-span-1 sm:col-span-2 lg:col-span-4">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="p-5 relative z-10">
              <p className="text-xs font-semibold text-amber-800/60 uppercase tracking-wider">Crecimiento de la Iglesia</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Nuevos Miembros</p>
                  <h4 className="text-2xl font-bold text-blue-600">{report.data.newMembers}</h4>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nuevos Visitantes</p>
                  <h4 className="text-2xl font-bold text-green-600">{report.data.newVisitors}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* BOTÓN DE ACTUALIZAR */}
      <div className="flex justify-center">
        <button onClick={() => fetchReport()} className="btn-primary flex items-center gap-2 px-8 py-3">
          <RefreshCw size={18} /> Actualizar Datos
        </button>
      </div>

      {/* VISTA PREVIA DE DATOS EN TABLA (Opcional para profundidad) */}
      <div className="card-premium overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Detalle del Reporte</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {!loading && report ? (
                <>
                  <tr><td className="font-medium">Asistencia Total</td><td>{report.data.attendance}</td></tr>
                  <tr><td className="font-medium">Ingresos</td><td>${report.data.income.toLocaleString()}</td></tr>
                  <tr><td className="font-medium">Gastos</td><td>${report.data.expense.toLocaleString()}</td></tr>
                  <tr><td className="font-medium">Balance Neto</td><td className={report.data.income - report.data.expense >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>${(report.data.income - report.data.expense).toLocaleString()}</td></tr>
                  <tr><td className="font-medium">Eventos Realizados</td><td>{report.data.events}</td></tr>
                  <tr><td className="font-medium">Sesiones de Consejería</td><td>{report.data.counseling}</td></tr>
                  <tr><td className="font-medium">Visitas Pastorales</td><td>{report.data.pastoral}</td></tr>
                  <tr><td className="font-medium">Nuevos Miembros</td><td>{report.data.newMembers}</td></tr>
                  <tr><td className="font-medium">Nuevos Visitantes</td><td>{report.data.newVisitors}</td></tr>
                </>
              ) : (
                <tr><td colSpan={2} className="text-center py-4 text-gray-400">Cargando datos...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}