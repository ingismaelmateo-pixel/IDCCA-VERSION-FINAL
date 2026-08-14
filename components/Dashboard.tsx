"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserPlus, Droplets, DollarSign,
  Calendar, Heart, Church, Star, AlertCircle,
  ArrowUp, ArrowDown, BarChart3, Gift, Cake, LineChart as IconLine,
  PieChart as IconPie, AreaChart as IconArea
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalMembers: number;
    totalMembersTrend: number;
    newMembersThisMonth: number;
    newMembersTrend: number;
    baptismsThisYear: number;
    baptismsTrend: number;
    monthAttendance: number;
    monthAttendanceTrend: number;
    tithesThisMonth: number;
    tithesTrend: number;
    offeringsThisMonth: number;
    offeringsTrend: number;
    activeMinistries: number;
    activeMinistriesTrend: number;
    pendingPrayers: number;
    pendingPrayersTrend: number;
    registeredVisitors: number;
    registeredVisitorsTrend: number;
    pendingFollowupCount: number;
  };
  charts: {
    monthlyTithes?: Array<{ month: string; total: string | number }>;
    monthlyOfferings?: Array<{ month: string; total: string | number }>;
    weeklyAttendance?: Array<{ day: string; count: number }>;
    memberGrowth?: Array<{ month: string; count: number }>;
    ministryDistribution?: Array<{ name: string; count?: number; member_count?: number; value?: number }>;
  };
  upcomingEvents?: Array<{
    id: number;
    title: string;
    startDate: string;
    location: string;
    eventType: string;
  }>;
  upcomingBirthdays?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    birth_date: string;
  }>;
}

const COLORS = ["#1e3a6e", "#c9a84c", "#10b981", "#8b5cf6", "#3b82f6", "#ef4444", "#f59e0b"];
const ALL_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const eventTypeColors: Record<string, string> = {
  congress: "bg-blue-100 text-blue-800",
  vigil: "bg-amber-100 text-amber-800",
  campaign: "bg-emerald-100 text-emerald-800",
  baptism: "bg-cyan-100 text-cyan-800",
  conference: "bg-indigo-100 text-indigo-800",
  retreat: "bg-teal-100 text-teal-800",
  service: "bg-blue-100 text-blue-800",
  other: "bg-gray-100 text-gray-800",
};

const eventTypeLabels: Record<string, string> = {
  congress: "Congreso",
  vigil: "Vigilia",
  campaign: "Campaña",
  baptism: "Bautismo",
  conference: "Conferencia",
  retreat: "Retiro",
  service: "Servicio",
  other: "Otro",
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon, trend, color, bgColor, onClick }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer transform hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">{title}</p>
          <p className="text-2xl font-black tracking-tight" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{Math.abs(trend)}% vs mes anterior</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-2" style={{ background: bgColor, color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para cambiar el tipo de vista de cada gráfico
  const [financeChartType, setFinanceChartType] = useState<"area" | "bar" | "line">("area");
  const [ministryChartType, setMinistryChartType] = useState<"pie" | "bar">("pie");
  const [growthChartType, setGrowthChartType] = useState<"line" | "area" | "bar">("line");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar datos");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando dashboard:", err);
        setLoading(false);
      });
  }, []);

  const stats = data?.stats;
  const upcomingEvents = data?.upcomingEvents ?? [];
  const upcomingBirthdays = data?.upcomingBirthdays ?? [];

  const rawMinistries = data?.charts?.ministryDistribution ?? [];
  const ministryData = rawMinistries.map((m) => {
    const qty = Number(m.count ?? m.member_count ?? m.value ?? 0);
    return {
      name: m.name || "Sin Nombre",
      count: qty > 0 ? qty : 1
    };
  });

  const rawTithes = data?.charts?.monthlyTithes ?? [];
  const rawOfferings = data?.charts?.monthlyOfferings ?? [];
  const currentMonthIdx = new Date().getMonth();

  const financialData = ALL_MONTHS.slice(0, currentMonthIdx + 1).map((monthLabel) => {
    const tObj = rawTithes.find((t) => t.month.toLowerCase().includes(monthLabel.toLowerCase()));
    const oObj = rawOfferings.find((o) => o.month.toLowerCase().includes(monthLabel.toLowerCase()));

    return {
      month: monthLabel,
      tithes: tObj ? parseFloat(String(tObj.total)) : 0,
      offerings: oObj ? parseFloat(String(oObj.total)) : (monthLabel === ALL_MONTHS[currentMonthIdx] ? (stats?.offeringsThisMonth ?? 0) : 0),
    };
  });

  const rawGrowth = data?.charts?.memberGrowth ?? [];
  let accumulatedMembers = 0;
  const growthData = ALL_MONTHS.slice(0, currentMonthIdx + 1).map((monthLabel) => {
    const gObj = rawGrowth.find((g) => g.month.toLowerCase().includes(monthLabel.toLowerCase()));
    if (gObj) {
      accumulatedMembers = Number(gObj.count) || accumulatedMembers;
    }
    return {
      month: monthLabel,
      count: monthLabel === ALL_MONTHS[currentMonthIdx] ? (stats?.totalMembers ?? accumulatedMembers) : accumulatedMembers,
    };
  });

  const weeklyData = data?.charts?.weeklyAttendance ?? [
    { day: "Lun", count: 0 },
    { day: "Mar", count: stats?.monthAttendance ?? 0 },
    { day: "Mié", count: 0 },
    { day: "Jue", count: 0 },
    { day: "Vie", count: 0 },
    { day: "Sáb", count: 0 },
    { day: "Dom", count: 0 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
              <Star size={13} className="fill-amber-300 text-amber-300" /> Sistema de Gestión 
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">Dashboard Principal</h1>
          <p className="text-blue-200/80 text-sm capitalize">
            {new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-white -translate-y-12 translate-x-12 blur-2xl" />
        </div>
      </div>

      {/* Recordatorio Pastoral */}
      <div 
        onClick={() => router.push("/agenda-pastoral")} 
        className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 cursor-pointer hover:bg-amber-100/60 transition-all shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 text-amber-700">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Atención Pastoral Pendiente</p>
          <p className="text-xs text-amber-800/80 mt-0.5">
            Hay <strong>{stats?.pendingFollowupCount ?? 0} miembros</strong> sin seguimiento registrado este mes. Toca aquí para revisar.
          </p>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Miembros"
          value={loading ? "..." : (stats?.totalMembers ?? 0)}
          subtitle="Miembros activos"
          icon={<Users size={20} />}
          trend={stats?.totalMembersTrend}
          color="#1e3a6e"
          bgColor="rgba(30,58,110,0.08)"
          onClick={() => router.push("/miembros")}
        />
        <StatCard
          title="Nuevos Este Mes"
          value={loading ? "..." : (stats?.newMembersThisMonth ?? 0)}
          subtitle="Ingresos del mes"
          icon={<UserPlus size={20} />}
          trend={stats?.newMembersTrend}
          color="#059669"
          bgColor="rgba(16,185,129,0.08)"
          onClick={() => router.push("/miembros")}
        />
        <StatCard
          title="Bautismos"
          value={loading ? "..." : (stats?.baptismsThisYear ?? 0)}
          subtitle="Este año"
          icon={<Droplets size={20} />}
          trend={stats?.baptismsTrend}
          color="#2563eb"
          bgColor="rgba(37,99,235,0.08)"
          onClick={() => router.push("/bautismos")}
        />
        <StatCard
          title="Asistencia Mes"
          value={loading ? "..." : (stats?.monthAttendance ?? 0)}
          subtitle="Presentes acumulados"
          icon={<Church size={20} />}
          trend={stats?.monthAttendanceTrend}
          color="#7c3aed"
          bgColor="rgba(124,58,237,0.08)"
          onClick={() => router.push("/asistencia")}
        />
        <StatCard
          title="Diezmos Mes"
          value={loading ? "..." : formatCurrency(stats?.tithesThisMonth ?? 0)}
          subtitle="Total recaudado"
          icon={<DollarSign size={20} />}
          trend={stats?.tithesTrend}
          color="#b45309"
          bgColor="rgba(180,83,9,0.08)"
          onClick={() => router.push("/finanzas")}
        />
        <StatCard
          title="Ofrendas Mes"
          value={loading ? "..." : formatCurrency(stats?.offeringsThisMonth ?? 0)}
          subtitle="Total recaudado"
          icon={<Gift size={20} />}
          trend={stats?.offeringsTrend}
          color="#dc2626"
          bgColor="rgba(220,38,38,0.08)"
          onClick={() => router.push("/finanzas")}
        />
        <StatCard
          title="Ministerios"
          value={loading ? "..." : (stats?.activeMinistries ?? 0)}
          subtitle="Activos"
          icon={<Star size={20} />}
          trend={stats?.activeMinistriesTrend}
          color="#0891b2"
          bgColor="rgba(8,145,178,0.08)"
          onClick={() => router.push("/ministerios")}
        />
        <StatCard
          title="Oración"
          value={loading ? "..." : (stats?.pendingPrayers ?? 0)}
          subtitle="Peticiones pendientes"
          icon={<Heart size={20} />}
          trend={stats?.pendingPrayersTrend}
          color="#e11d48"
          bgColor="rgba(225,29,72,0.08)"
          onClick={() => router.push("/oracion")}
        />
      </div>

      {/* Fila 1 de Gráficas con Selectores */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico Financiero Dinámico */}
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Ingresos Financieros</h3>
              <p className="text-xs text-slate-400">Comparativa de diezmos y ofrendas durante el año</p>
            </div>
            {/* Controles de cambio de gráfico */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFinanceChartType("area")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${financeChartType === "area" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                title="Área"
              >
                <IconArea size={14} /> Área
              </button>
              <button
                onClick={() => setFinanceChartType("bar")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${financeChartType === "bar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                title="Barras"
              >
                <BarChart3 size={14} /> Barras
              </button>
              <button
                onClick={() => setFinanceChartType("line")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${financeChartType === "line" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                title="Líneas"
              >
                <IconLine size={14} /> Línea
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {financeChartType === "area" ? (
                <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tithesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a6e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a6e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="offeringsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1) + "k" : v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), ""]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="tithes" name="Diezmos" stroke="#1e3a6e" strokeWidth={3} fill="url(#tithesGrad)" />
                  <Area type="monotone" dataKey="offerings" name="Ofrendas" stroke="#f59e0b" strokeWidth={3} fill="url(#offeringsGrad)" />
                </AreaChart>
              ) : financeChartType === "bar" ? (
                <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1) + "k" : v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), ""]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Bar dataKey="tithes" name="Diezmos" fill="#1e3a6e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offerings" name="Ofrendas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1) + "k" : v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), ""]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="tithes" name="Diezmos" stroke="#1e3a6e" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="offerings" name="Ofrendas" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ministerios Dinámico */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Ministerios</h3>
              <p className="text-xs text-slate-400">Distribución activa</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMinistryChartType("pie")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${ministryChartType === "pie" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                <IconPie size={14} />
              </button>
              <button
                onClick={() => setMinistryChartType("bar")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${ministryChartType === "bar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                <BarChart3 size={14} />
              </button>
            </div>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {ministryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full border-2 border-dashed border-slate-100 rounded-2xl text-slate-400">
                <Star size={32} className="mb-2 text-slate-300" />
                <p className="text-xs font-medium">Sin datos de ministerios.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {ministryChartType === "pie" ? (
                  <PieChart>
                    <Pie data={ministryData} cx="50%" cy="42%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="count">
                      {ministryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} integrantes`, "Membresía"]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  </PieChart>
                ) : (
                  <BarChart data={ministryData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip formatter={(v) => [`${v} miembros`, "Total"]} />
                    <Bar dataKey="count" fill="#1e3a6e" radius={[0, 6, 6, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Fila 2 de Gráficas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Asistencia Semanal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-extrabold text-slate-800">Asistencia Semanal</h3>
            <p className="text-xs text-slate-400">Registros por día de la semana</p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [String(v) + " personas", "Asistencia"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crecimiento de Membresía Dinámico */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Crecimiento de Membresía</h3>
              <p className="text-xs text-slate-400">Evolución acumulada del año</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setGrowthChartType("line")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${growthChartType === "line" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                <IconLine size={14} />
              </button>
              <button
                onClick={() => setGrowthChartType("area")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${growthChartType === "area" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                <IconArea size={14} />
              </button>
              <button
                onClick={() => setGrowthChartType("bar")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${growthChartType === "bar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                <BarChart3 size={14} />
              </button>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {growthChartType === "line" ? (
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [String(v) + " miembros", "Total acumulado"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3.5} dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "#ffffff" }} activeDot={{ r: 7, fill: "#10b981" }} />
                </LineChart>
              ) : growthChartType === "area" ? (
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [String(v) + " miembros", "Total acumulado"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fill="url(#growthGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [String(v) + " miembros", "Total acumulado"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fila Inferior: Eventos, Cumpleaños y Acciones */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Próximos Eventos</h3>
              <p className="text-xs text-slate-400">Agenda de la iglesia</p>
            </div>
            <button 
              onClick={() => router.push("/eventos")} 
              className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                No hay eventos programados próximamente.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 hover:bg-blue-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/10 flex items-center justify-center text-blue-900 shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{event.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(event.startDate)} · {event.location}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${eventTypeColors[event.eventType] ?? "bg-slate-100 text-slate-800"}`}>
                    {eventTypeLabels[event.eventType] ?? event.eventType}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cumpleaños y Acciones Rápidas */}
        <div className="space-y-6">
          {/* Cumpleaños */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Cake size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Cumpleaños Próximos</h3>
                <p className="text-xs text-slate-400">Hermanos a felicitar este mes</p>
              </div>
            </div>
            <div className="space-y-2">
              {upcomingBirthdays.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                  No hay cumpleaños próximos este mes.
                </div>
              ) : (
                upcomingBirthdays.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-900 text-white font-bold text-xs flex items-center justify-center">
                        {b.first_name[0]}{b.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{b.first_name} {b.last_name}</p>
                        <p className="text-xs text-slate-400">{formatDate(b.birth_date)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">Este Mes</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Nuevo Miembro", icon: <UserPlus size={16} />, color: "#1e3a6e", path: "/miembros/nuevo" },
                { label: "Nueva Ofrenda", icon: <DollarSign size={16} />, color: "#b45309", path: "/finanzas/nueva-ofrenda" },
                { label: "Tomar Asistencia", icon: <BarChart3 size={16} />, color: "#10b981", path: "/asistencia/tomar" },
                { label: "Solicitud Oración", icon: <Heart size={16} />, color: "#e11d48", path: "/oracion/nueva" },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => router.push(action.path)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] text-left cursor-pointer border"
                  style={{ background: `${action.color}08`, color: action.color, borderColor: `${action.color}18` }}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}