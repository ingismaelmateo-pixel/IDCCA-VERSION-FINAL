"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Landmark, Plus, X, Check, Calendar, 
  TrendingUp, TrendingDown, RefreshCw, Banknote,
  Lock, Unlock, AlertCircle, Clock, Wallet, Receipt,
  ArrowUpRight, ArrowDownRight, Scale, Copy, Calculator, History,
  Edit2, Save
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CashRegister {
  id: number;
  openingBalance: string;
  closingBalance: string | null;
  openingDate: string;
  closingDate: string | null;
  totalIncome: string | null;
  totalExpenses: string | null;
  cashierId: number | null;
  notes: string | null;
  status: 'open' | 'closed';
}

interface TreasuryKPIs {
  openingBalance: number;
  dayIncome: number;
  incomeCount: number;
  dayExpense: number;
  expenseCount: number;
  netFlow: number;
  estimatedClosingBalance: number;
  avgIncomeTransaction: number;
  expenseRatio: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: string;
  type: string;
  category?: string;
  paymentMethod?: string;
  transactionDate: string;
}

export default function TesoreriaPage() {
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [kpis, setKpis] = useState<TreasuryKPIs>({
    openingBalance: 0,
    dayIncome: 0,
    incomeCount: 0,
    dayExpense: 0,
    expenseCount: 0,
    netFlow: 0,
    estimatedClosingBalance: 0,
    avgIncomeTransaction: 0,
    expenseRatio: "0.0",
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales y Formulario
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  
  // ✅ NUEVO: Campos editables para el arqueo
  const [closingBalance, setClosingBalance] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [manualIncome, setManualIncome] = useState<number>(0);
  const [manualExpenses, setManualExpenses] = useState<number>(0);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isEditingExpenses, setIsEditingExpenses] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchTreasuryData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/treasury');
      if (!res.ok) throw new Error("Error al consultar datos");
      const data = await res.json();
      
      setRegister(data.register || null);
      if (data.kpis) {
        setKpis(data.kpis);
        // ✅ Sincronizar valores manuales con los KPIs
        setManualIncome(data.kpis.dayIncome || 0);
        setManualExpenses(data.kpis.dayExpense || 0);
      }
      setRecentTransactions(data.recentTransactions || []);
    } catch (e) {
      console.error("Error fetching treasury:", e);
      showToast("❌ Error al cargar datos de tesorería", 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchTreasuryData(); 
  }, [fetchTreasuryData]);

  // ============================================================
  // ABRIR CAJA
  // ============================================================
  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingBalance || isNaN(Number(openingBalance))) {
      showToast("⚠️ Ingrese un saldo inicial válido", 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingBalance: parseFloat(openingBalance), cashierId: 1 })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Caja abierta exitosamente", 'success');
        setShowOpenModal(false);
        setOpeningBalance("");
        fetchTreasuryData();
      } else {
        showToast(`❌ ${data.error || "Error al abrir la caja"}`, 'error');
      }
    } catch (e) {
      showToast("❌ Error de conexión al servidor", 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CERRAR CAJA (ARQUEO) - MODIFICADO
  // ============================================================
  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!register) return;
    if (!closingBalance || isNaN(Number(closingBalance))) {
      showToast("⚠️ Ingrese el saldo real contado", 'error');
      return;
    }

    // ✅ Calcular el saldo teórico con los valores manuales
    const theoreticalBalance = kpis.openingBalance + manualIncome - manualExpenses;
    const variance = parseFloat(closingBalance) - theoreticalBalance;

    setSaving(true);
    try {
      const res = await fetch('/api/treasury', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: register.id, 
          closingBalance: parseFloat(closingBalance), 
          notes: closingNotes,
          dayIncome: manualIncome,
          dayExpense: manualExpenses,
          theoreticalBalance: theoreticalBalance,
          variance: variance
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Caja cerrada y arqueada exitosamente", 'success');
        setShowCloseModal(false);
        setClosingBalance("");
        setClosingNotes("");
        setManualIncome(0);
        setManualExpenses(0);
        fetchTreasuryData();
      } else {
        showToast(`❌ ${data.error || "Error al cerrar la caja"}`, 'error');
      }
    } catch (e) {
      showToast("❌ Error de conexión al servidor", 'error');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Cálculos para el arqueo
  const theoreticalBalance = kpis.openingBalance + manualIncome - manualExpenses;
  const actualClosingNum = parseFloat(closingBalance || "0");
  const variance = actualClosingNum - theoreticalBalance;

  // ✅ Función para abrir el modal de cierre
  const handleOpenCloseModal = () => {
    setClosingBalance(kpis.estimatedClosingBalance.toString());
    setManualIncome(kpis.dayIncome || 0);
    setManualExpenses(kpis.dayExpense || 0);
    setShowCloseModal(true);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 animate-in slide-in-from-top-5 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-rose-50 border-rose-500 text-rose-900'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="text-emerald-600 flex-shrink-0" /> : <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Landmark size={26} />
            </div>
            Control de Tesorería
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestión de flujo de caja en tiempo real, arqueo de valores e indicadores financieros
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchTreasuryData} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all duration-200 flex items-center gap-2 shadow-sm">
            <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* BANNER PRINCIPAL DE ESTADO */}
      <div className={`rounded-3xl p-6 border transition-all duration-300 shadow-sm ${
        register?.status === 'open' 
          ? 'bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 border-emerald-800 text-white' 
          : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl flex items-center justify-center ${
              register?.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600'
            }`}>
              {register?.status === 'open' ? <Unlock size={36} /> : <Lock size={36} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  Estado de Caja
                </span>
                {register?.status === 'open' && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black mt-1 tracking-tight">
                {loading ? "Cargando..." : register?.status === 'open' ? "CAJA ABIERTA" : "CAJA CERRADA"}
              </h2>
              {register?.status === 'open' && register.openingDate && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-400" />
                  Apertura: <span className="text-slate-200 font-semibold">{formatDate(register.openingDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {register?.status === 'open' ? (
              <button 
                onClick={handleOpenCloseModal}
                className="w-full md:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <Lock size={18} /> Realizar Arqueo y Cerrar
              </button>
            ) : (
              <button 
                onClick={() => setShowOpenModal(true)} 
                className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <Unlock size={18} /> Abrir Nueva Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD DE KPIS DE TESORERÍA */}
      {register?.status === 'open' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* KPI 1: SALDO INICIAL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Saldo Inicial</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={18} /></div>
            </div>
            <div className="text-2xl font-black text-slate-900">${kpis.openingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-2">Monto base registrado al abrir</p>
          </div>

          {/* KPI 2: INGRESOS DEL DÍA - CON EDITOR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ingresos Totales</span>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
                <button 
                  onClick={() => setIsEditingIncome(!isEditingIncome)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Editar ingresos"
                >
                  <Edit2 size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>
            {isEditingIncome ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border-2 border-emerald-300 rounded-xl text-right text-2xl font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-emerald-50"
                  value={manualIncome}
                  onChange={(e) => setManualIncome(parseFloat(e.target.value) || 0)}
                  onBlur={() => setIsEditingIncome(false)}
                  autoFocus
                />
                <button 
                  onClick={() => setIsEditingIncome(false)}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="text-2xl font-black text-emerald-600">+${manualIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
            )}
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{kpis.incomeCount} transacciones</span>
              <span className="font-semibold text-emerald-700">Prom: ${kpis.avgIncomeTransaction.toFixed(0)}</span>
            </div>
          </div>

          {/* KPI 3: GASTOS DEL DÍA - CON EDITOR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Egresos / Gastos</span>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><TrendingDown size={18} /></div>
                <button 
                  onClick={() => setIsEditingExpenses(!isEditingExpenses)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Editar egresos"
                >
                  <Edit2 size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>
            {isEditingExpenses ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border-2 border-rose-300 rounded-xl text-right text-2xl font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50"
                  value={manualExpenses}
                  onChange={(e) => setManualExpenses(parseFloat(e.target.value) || 0)}
                  onBlur={() => setIsEditingExpenses(false)}
                  autoFocus
                />
                <button 
                  onClick={() => setIsEditingExpenses(false)}
                  className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="text-2xl font-black text-rose-600">-${manualExpenses.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
            )}
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{kpis.expenseCount} salidas</span>
              <span className="font-semibold text-rose-700">Gasto/Ingreso: {kpis.expenseRatio}%</span>
            </div>
          </div>

          {/* KPI 4: ESTIMADO EN CAJA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-blue-50/50 to-white">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Saldo Teórico Esperado</span>
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20"><Calculator size={18} /></div>
            </div>
            <div className="text-2xl font-black text-blue-900">${theoreticalBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-500">Flujo Neto del día:</span>
              <span className={`font-bold ${manualIncome - manualExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {manualIncome - manualExpenses >= 0 ? '+' : ''}${(manualIncome - manualExpenses).toLocaleString('es-DO')}
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Banknote className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No hay turno de caja activo</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Para registrar o conciliar entradas y salidas en efectivo, debes abrir un nuevo turno de caja.
          </p>
          <button onClick={() => setShowOpenModal(true)} className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2">
            <Unlock size={16} /> Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* ULTIMOS MOVIMIENTOS DEL TURNO */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <History size={18} className="text-blue-600" />
              Movimientos del Turno
            </h3>
            <span className="text-xs text-slate-400 font-medium">{recentTransactions.length} registros recientes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                  <th className="py-3 px-5">Tipo</th>
                  <th className="py-3 px-5">Descripción</th>
                  <th className="py-3 px-5">Fecha / Hora</th>
                  <th className="py-3 px-5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {recentTransactions.map((tx) => {
                  const isIncome = ['tithe', 'offering', 'donation', 'income'].includes(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isIncome ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isIncome ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-800 font-semibold">{tx.description || "Sin descripción"}</td>
                      <td className="py-3 px-5 text-slate-500 text-xs">{formatDate(tx.transactionDate)}</td>
                      <td className={`py-3 px-5 text-right font-bold text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}${parseFloat(tx.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ABRIR CAJA */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Unlock size={22} /></div>
                <div>
                  <h3 className="font-bold text-lg">Apertura de Caja</h3>
                  <p className="text-xs text-blue-100">Iniciar turno de administración de fondos</p>
                </div>
              </div>
              <button onClick={() => setShowOpenModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleOpenRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Monto / Saldo Inicial en Efectivo ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required 
                    autoFocus
                    placeholder="0.00" 
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    value={openingBalance} 
                    onChange={(e) => setOpeningBalance(e.target.value)} 
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Introduce el monto físico exacto en fondo de caja al iniciar.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowOpenModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2">
                  {saving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL: CERRAR CAJA Y ARQUEO - MODIFICADO CON INGRESOS Y EGRESOS EDITABLES */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Scale size={22} /></div>
                <div>
                  <h3 className="font-bold text-lg">Arqueo y Cierre de Caja</h3>
                  <p className="text-xs text-rose-100">Conciliación final de valores contados</p>
                </div>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* ✅ CÁLCULO DE FONDOS TEÓRICOS CON INPUTS EDITABLES */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CÁLCULO DE FONDOS TEÓRICOS</div>
                
                {/* Saldo Inicial (solo lectura) */}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>(+) Saldo Inicial:</span>
                  <span className="font-semibold">${kpis.openingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {/* ✅ Ingresos del Turno (EDITABLE) */}
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-2 border border-emerald-200">
                  <span className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                    <TrendingUp size={16} /> (+) Ingresos del Turno:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-40 px-3 py-1.5 border border-emerald-200 rounded-lg text-right font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                      value={manualIncome}
                      onChange={(e) => setManualIncome(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* ✅ Egresos del Turno (EDITABLE) */}
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-2 border border-rose-200">
                  <span className="text-sm font-semibold text-rose-700 flex items-center gap-2">
                    <TrendingDown size={16} /> (-) Egresos / Gastos del Turno:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-700 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-40 px-3 py-1.5 border border-rose-200 rounded-lg text-right font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                      value={manualExpenses}
                      onChange={(e) => setManualExpenses(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Saldo Teórico Esperado (resultado) */}
                <div className="border-t-2 border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-800">
                  <span className="text-blue-700">Saldo Teórico Esperado:</span>
                  <span className="text-blue-600 text-lg">${theoreticalBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <form onSubmit={handleCloseRegister} className="space-y-4">
                {/* SALDO REAL CONTADO */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      SALDO REAL CONTADO EN CAJA ($)
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setClosingBalance(theoreticalBalance.toString())}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Copy size={14} /> Copiar Teórico
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="0.00" 
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 text-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all" 
                      value={closingBalance} 
                      onChange={(e) => setClosingBalance(e.target.value)} 
                    />
                  </div>
                </div>

                {/* ✅ INDICADOR DE ARQUEO MEJORADO */}
                {closingBalance !== "" && !isNaN(actualClosingNum) && (
                  <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                    Math.abs(variance) < 0.01 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : variance > 0 
                      ? 'bg-blue-50 border-blue-300 text-blue-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {Math.abs(variance) < 0.01 ? (
                        <Check size={20} className="text-emerald-600" />
                      ) : variance > 0 ? (
                        <TrendingUp size={20} className="text-blue-600" />
                      ) : (
                        <TrendingDown size={20} className="text-rose-600" />
                      )}
                      <span className="font-bold text-sm">
                        {Math.abs(variance) < 0.01 
                          ? '✅ Arqueo Perfecto (Caja Cuadrada)' 
                          : variance > 0 
                          ? '🔵 Sobrante en Caja' 
                          : '🔴 Faltante en Caja'}
                      </span>
                    </div>
                    <span className="text-lg font-black">
                      {variance > 0 ? '+' : ''}${variance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* OBSERVACIONES */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    OBSERVACIONES / NOTAS DEL ARQUEO
                  </label>
                  <textarea 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all resize-none" 
                    rows={3} 
                    value={closingNotes} 
                    onChange={(e) => setClosingNotes(e.target.value)} 
                    placeholder="Escribe aquí novedades sobre faltantes, sobrantes o depósitos de cierre..." 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowCloseModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-sm transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 transition-all flex items-center gap-2">
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Lock size={16} />}
                    Cerrar y Concluir Turno
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}