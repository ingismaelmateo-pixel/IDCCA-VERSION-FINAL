"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  TrendingUp, TrendingDown, Wallet, PieChart, 
  BarChart2, Calendar, Download, RefreshCw, Users
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";

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
    incomeDistribution: { tithe: number; offering: number; donation: number };
    topMembers: { memberId: number; firstName: string; lastName: string; total: number }[];
  };
}

const periodLabels: Record<string, string> = {
  week: "Semanal",
  quincena: "Quincenal",
  month: "Mensual",
  year: "Anual",
};

const COLORS = ['#22c55e', '#3b82f6', '#a855f7'];

export default function FinanceReports() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("year");

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

  // Preparar datos para el gráfico de barras
  const barChartData = report ? [
    { name: 'Ingresos', value: report.data.income },
    { name: 'Gastos', value: report.data.expense },
  ] : [];

  // 🛡️ CORRECCIÓN: Preparar datos para el gráfico circular con validación
  const pieData = report?.data?.incomeDistribution ? [
    { name: 'Diezmos', value: report.data.incomeDistribution.tithe || 0 },
    { name: 'Ofrendas', value: report.data.incomeDistribution.offering || 0 },
    { name: 'Donaciones', value: report.data.incomeDistribution.donation || 0 },
  ] : [
    { name: 'Diezmos', value: 0 },
    { name: 'Ofrendas', value: 0 },
    { name: 'Donaciones', value: 0 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header del reporte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={24} className="text-blue-600" />
            Reportes Financieros
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Análisis de ingresos, gastos y tendencias
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
          <button onClick={() => fetchReport()} className="btn-outline text-sm flex items-center gap-2">
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* Rango de fechas */}
      {report && !loading && (
        <div className="card-premium p-3 bg-blue-50/50 border border-blue-100 flex items-center gap-2 text-sm text-blue-700">
          <Calendar size={16} />
          <span className="font-medium">Período {periodLabels[selectedPeriod]}:</span>
          <span>{formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}</span>
        </div>
      )}

      {/* KPIs Financieros */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-24 animate-pulse bg-white/80" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="p-5 relative z-10">
                <div>
                  <p className="text-xs font-semibold text-green-800/60 uppercase tracking-wider">Ingresos</p>
                  <h4 className="text-3xl font-bold text-green-600 mt-1">${report.data.income.toLocaleString()}</h4>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25 text-white ring-4 ring-white/20">
                  <TrendingUp size={22} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="p-5 relative z-10">
                <div>
                  <p className="text-xs font-semibold text-red-800/60 uppercase tracking-wider">Gastos</p>
                  <h4 className="text-3xl font-bold text-red-600 mt-1">${report.data.expense.toLocaleString()}</h4>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg shadow-red-500/25 text-white ring-4 ring-white/20">
                  <TrendingDown size={22} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="p-5 relative z-10">
                <div>
                  <p className="text-xs font-semibold text-blue-800/60 uppercase tracking-wider">Balance Neto</p>
                  <h4 className={`text-3xl font-bold mt-1 ${report.data.income - report.data.expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${(report.data.income - report.data.expense).toLocaleString()}
                  </h4>
                </div>
                <div className={`p-3.5 rounded-2xl ${report.data.income - report.data.expense >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                  <Wallet size={22} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico de Barras */}
            <div className="card-premium p-6 bg-white/80 backdrop-blur-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-500" />
                Ingresos vs Gastos
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`$${value.toLocaleString()}`, 'Monto']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico Circular */}
            <div className="card-premium p-6 bg-white/80 backdrop-blur-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-purple-500" />
                Distribución de Ingresos
              </h3>
              <div className="h-64 w-full">
                {/* 🛡️ Validación: Solo mostrar el gráfico si el total de ingresos es > 0 */}
                {report && report.data.income > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Monto']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No hay datos de ingresos para este período
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top 5 Miembros */}
          <div className="card-premium overflow-hidden bg-white/80 backdrop-blur-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Users size={16} /> Top 5 Miembros con Mayor Aporte
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Miembro</th>
                    <th>Total Aportado</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.topMembers.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">No hay suficientes datos para mostrar el ranking.</td></tr>
                  ) : (
                    report.data.topMembers.map((member, index) => (
                      <tr key={member.memberId} className="group hover:bg-gray-50 transition-colors">
                        <td className="font-bold text-gray-500 text-center w-12">
                          {index === 0 && <span className="text-yellow-500 text-lg">🥇</span>}
                          {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                          {index === 2 && <span className="text-orange-500 text-lg">🥉</span>}
                          {index > 2 && `#${index + 1}`}
                        </td>
                        <td className="font-medium text-sm text-gray-800">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="font-bold text-green-600">
                          ${parseFloat(String(member.total)).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}