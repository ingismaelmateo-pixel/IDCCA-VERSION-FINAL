"use client";

import { BarChart3, Download, FileText, Users, DollarSign, Calendar, Package } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const yearlyData = [
  { year: "2021", members: 145, tithes: 680000, offerings: 220000 },
  { year: "2022", members: 168, tithes: 810000, offerings: 285000 },
  { year: "2023", members: 195, tithes: 920000, offerings: 340000 },
  { year: "2024", members: 218, tithes: 1050000, offerings: 385000 },
];

const ministryData = [
  { name: "Alabanza", members: 28, budget: 50000 },
  { name: "Jóvenes", members: 45, budget: 35000 },
  { name: "Niños", members: 32, budget: 25000 },
  { name: "Damas", members: 38, budget: 20000 },
  { name: "Varones", members: 25, budget: 18000 },
  { name: "Misiones", members: 18, budget: 80000 },
];

const reportTemplates = [
  { title: "Reporte de Membresía", desc: "Lista completa de miembros con datos demográficos", icon: <Users size={20} />, format: "PDF", color: "#1e3a6e" },
  { title: "Estado Financiero", desc: "Ingresos, gastos y balance del período seleccionado", icon: <DollarSign size={20} />, format: "Excel", color: "#c9a84c" },
  { title: "Reporte de Asistencia", desc: "Estadísticas de asistencia por culto y período", icon: <Calendar size={20} />, format: "PDF", color: "#10b981" },
  { title: "Actividad de Ministerios", desc: "Resumen de actividades y participación por ministerio", icon: <BarChart3 size={20} />, format: "PDF", color: "#8b5cf6" },
  { title: "Inventario General", desc: "Lista de activos con valoración y estado", icon: <Package size={20} />, format: "Excel", color: "#ef4444" },
  { title: "Reporte de Visitantes", desc: "Visitantes registrados, seguimiento y conversiones", icon: <Users size={20} />, format: "PDF", color: "#0891b2" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-900">Centro de Reportes</h2>
        <p className="text-gray-400 text-sm mt-0.5">Genera reportes detallados en PDF, Excel o Word</p>
      </div>

      {/* Report Templates */}
      <div>
        <h3 className="section-title mb-4">Plantillas de Reportes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportTemplates.map((report, i) => (
            <div key={i} className="card-premium p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${report.color}12`, color: report.color }}>
                {report.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-800 mb-0.5">{report.title}</h4>
                <p className="text-xs text-gray-400">{report.desc}</p>
              </div>
              <button
                className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${report.color}, ${report.color}cc)` }}
              >
                <Download size={13} />
                {report.format}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Annual Comparison */}
        <div className="card-premium p-6">
          <h3 className="section-title mb-1">Comparación Anual</h3>
          <p className="section-subtitle mb-4">Crecimiento histórico de la congregación</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearlyData} barSize={24} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid #dde3f0", fontSize: "0.8125rem" }} />
              <Bar dataKey="members" fill="#1e3a6e" radius={[4, 4, 0, 0]} name="Miembros" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Trend */}
        <div className="card-premium p-6">
          <h3 className="section-title mb-1">Tendencia Financiera</h3>
          <p className="section-subtitle mb-4">Ingresos anuales históricos</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), ""]}
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid #dde3f0", fontSize: "0.8125rem" }}
              />
              <Legend />
              <Line type="monotone" dataKey="tithes" stroke="#1e3a6e" strokeWidth={2.5} name="Diezmos" dot={{ r: 4, fill: "#1e3a6e" }} />
              <Line type="monotone" dataKey="offerings" stroke="#c9a84c" strokeWidth={2.5} name="Ofrendas" dot={{ r: 4, fill: "#c9a84c" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ministry Report */}
        <div className="card-premium p-6 xl:col-span-2">
          <h3 className="section-title mb-1">Reporte de Ministerios</h3>
          <p className="section-subtitle mb-4">Distribución de miembros y presupuesto por ministerio</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ministryData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#8899bb" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid #dde3f0", fontSize: "0.8125rem" }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="members" fill="#1e3a6e" radius={[4, 4, 0, 0]} name="Miembros" />
              <Bar yAxisId="right" dataKey="budget" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Presupuesto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="section-title">Resumen Ejecutivo {new Date().getFullYear()}</h3>
        </div>
        <table className="table-modern">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Ene-Jun</th>
              <th>Jul-Oct</th>
              <th>Nov</th>
              <th>Total Acumulado</th>
              <th>Variación</th>
            </tr>
          </thead>
          <tbody>
            {[
              { indicator: "Diezmos", h1: "RD$348,000", h2: "RD$292,000", current: "RD$82,000", total: "RD$722,000", var: "+9.3%" },
              { indicator: "Ofrendas", h1: "RD$90,000", h2: "RD$87,000", current: "RD$28,500", total: "RD$205,500", var: "+5.2%" },
              { indicator: "Donaciones", h1: "RD$45,000", h2: "RD$38,000", current: "RD$15,000", total: "RD$98,000", var: "+12.1%" },
              { indicator: "Gastos Operativos", h1: "RD$210,000", h2: "RD$185,000", current: "RD$68,200", total: "RD$463,200", var: "+3.8%" },
              { indicator: "Nuevos Miembros", h1: "42", h2: "35", current: "8", total: "85", var: "+15.4%" },
              { indicator: "Bautismos", h1: "14", h2: "8", current: "2", total: "24", var: "+9.1%" },
            ].map((row, i) => (
              <tr key={i}>
                <td><span className="font-semibold text-sm text-gray-800">{row.indicator}</span></td>
                <td><span className="text-sm text-gray-600">{row.h1}</span></td>
                <td><span className="text-sm text-gray-600">{row.h2}</span></td>
                <td><span className="text-sm font-semibold text-blue-900">{row.current}</span></td>
                <td><span className="text-sm font-bold text-gray-800">{row.total}</span></td>
                <td>
                  <span className={`badge ${row.var.startsWith("+") ? "badge-success" : "badge-danger"}`}>
                    {row.var}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
