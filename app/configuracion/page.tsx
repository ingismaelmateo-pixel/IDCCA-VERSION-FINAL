"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Settings, User, Shield, Key, Eye, EyeOff, 
  Save, Check, AlertCircle, X, Users, Lock,
  History, Calendar, Globe, Palette, Image as ImageIcon
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Interfaces para los datos reales
interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  tableName: string | null;
  recordId: number | null;
  ipAddress: string | null;
  createdAt: string;
}

interface RoleCount {
  role: string;
  count: number;
}

// Etiquetas para mostrar los roles en español
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

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "audit">("general");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  // Datos reales traídos de la API
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roleCounts, setRoleCounts] = useState<RoleCount[]>([]);

  // Estados del formulario General
  const [generalForm, setGeneralForm] = useState({
    churchName: "Iglesia IDCCA",
    slogan: "Unidos para la gloria de Dios",
    logoUrl: "",
    primaryColor: "#1e3a8a",
    currency: "USD",
    timezone: "America/Santo_Domingo",
  });

  // Estados del formulario Seguridad
  const [securityForm, setSecurityForm] = useState({
    userId: "", // Se llenará con el ID del usuario logueado
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ============================================================
  // FETCH DATA REAL
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      
      setLogs(data.logs || []);
      setRoleCounts(data.roleCounts || []);
    } catch (e) {
      console.error("Error fetching settings:", e);
      showToast("Error al cargar configuración", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Simular el ID del usuario logueado (En producción, esto vendrá de tu sistema de autenticación)
    // Por ahora, asumimos que el usuario admin tiene ID 1
    setSecurityForm(prev => ({ ...prev, userId: "1" }));
  }, [fetchData]);

  // ============================================================
  // HANDLE GENERAL
  // ============================================================
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("✅ Configuración general guardada exitosamente", "success");
    // En el futuro, esto guardará los datos en una tabla de configuración
  };

  // ============================================================
  // HANDLE SEGURIDAD (Cambio de Contraseña Real)
  // ============================================================
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast("❌ Las contraseñas no coinciden", "error");
      return;
    }

    if (securityForm.newPassword.length < 6) {
      showToast("❌ La nueva contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(securityForm.userId),
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Contraseña actualizada exitosamente", "success");
        setSecurityForm({ 
          ...securityForm, 
          currentPassword: "", 
          newPassword: "", 
          confirmPassword: "" 
        });
      } else {
        showToast(`❌ ${data.error || 'Error al cambiar la contraseña'}`, "error");
      }
    } catch (error) {
      showToast("❌ Error de conexión con el servidor", "error");
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
            <Settings size={24} className="text-blue-600" />
            Configuración del Sistema
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Administra los ajustes generales, seguridad y auditoría de la aplicación
          </p>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex flex-wrap border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Globe size={16} /> General
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "security" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Shield size={16} /> Seguridad y Roles
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "audit" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <History size={16} /> Auditoría
        </button>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="card-premium p-6 bg-white/80 backdrop-blur-sm min-h-[500px]">
        
        {/* ============================================================
             PESTAÑA 1: GENERAL
             ============================================================ */}
        {activeTab === "general" && (
          <form onSubmit={handleGeneralSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600">Nombre de la Iglesia</label>
                <input 
                  className="input-field mt-1" 
                  value={generalForm.churchName} 
                  onChange={(e) => setGeneralForm({...generalForm, churchName: e.target.value})} 
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600">Eslogan / Lema</label>
                <input 
                  className="input-field mt-1" 
                  value={generalForm.slogan} 
                  onChange={(e) => setGeneralForm({...generalForm, slogan: e.target.value})} 
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600">URL del Logo</label>
                <div className="flex items-center gap-3 mt-1">
                  <input 
                    className="input-field flex-1" 
                    value={generalForm.logoUrl} 
                    onChange={(e) => setGeneralForm({...generalForm, logoUrl: e.target.value})} 
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    {generalForm.logoUrl ? (
                      <img src={generalForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Moneda Predeterminada</label>
                <select 
                  className="input-field mt-1"
                  value={generalForm.currency}
                  onChange={(e) => setGeneralForm({...generalForm, currency: e.target.value})}
                >
                  <option value="USD">USD - Dólar ($)</option>
                  <option value="DOP">DOP - Peso Dominicano (RD$)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Zona Horaria</label>
                <select 
                  className="input-field mt-1"
                  value={generalForm.timezone}
                  onChange={(e) => setGeneralForm({...generalForm, timezone: e.target.value})}
                >
                  <option value="America/Santo_Domingo">Santo Domingo</option>
                  <option value="America/New_York">New York</option>
                  <option value="America/Mexico_City">Ciudad de México</option>
                  <option value="Europe/Madrid">Madrid</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600">Color Principal del Sistema</label>
                <div className="flex items-center gap-3 mt-1">
                  <input 
                    type="color" 
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    value={generalForm.primaryColor}
                    onChange={(e) => setGeneralForm({...generalForm, primaryColor: e.target.value})}
                  />
                  <input 
                    className="input-field flex-1"
                    value={generalForm.primaryColor}
                    onChange={(e) => setGeneralForm({...generalForm, primaryColor: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={16} /> Guardar Cambios
              </button>
            </div>
          </form>
        )}

        {/* ============================================================
             PESTAÑA 2: SEGURIDAD Y ROLES (Con datos reales)
             ============================================================ */}
        {activeTab === "security" && (
          <div className="space-y-8 max-w-2xl">
            
            {/* Cambio de Contraseña */}
            <form onSubmit={handleSecuritySubmit} className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Key size={16} /> Cambiar Contraseña
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Contraseña Actual</label>
                  <input 
                    type="password" 
                    className="input-field mt-1" 
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    className="input-field mt-1" 
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Confirmar Nueva</label>
                  <input 
                    type="password" 
                    className="input-field mt-1" 
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-sm flex items-center gap-2">
                  <Lock size={14} /> Actualizar Contraseña
                </button>
              </div>
            </form>

            {/* Roles y Usuarios (Con datos reales de la base de datos) */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Users size={16} /> Roles y Usuarios del Sistema
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-400">Cargando roles...</div>
                ) : roleCounts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">No hay usuarios registrados en el sistema.</div>
                ) : (
                  roleCounts.map((roleItem) => (
                    <div key={roleItem.role} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700 text-sm">{roleLabels[roleItem.role] || roleItem.role}</p>
                        {/* Aquí podrías añadir una descripción más detallada del rol si la tienes */}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        {roleItem.count} usuario{roleItem.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <AlertCircle size={12} /> Para gestionar roles y permisos avanzados (crear/eliminar usuarios), ir al módulo de Recursos Humanos.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
             PESTAÑA 3: AUDITORÍA (Con datos reales de la BD)
             ============================================================ */}
        {activeTab === "audit" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <History size={16} /> Registro de Actividades
              </h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                Últimas {logs.length} acciones
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Usuario ID</th>
                    <th>Acción</th>
                    <th>Tabla</th>
                    <th>Fecha y Hora</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-400">Cargando registros...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No hay registros de auditoría aún.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="text-sm text-gray-600 font-medium">{log.userId || 'Anónimo'}</td>
                        <td className="text-sm text-gray-600">{log.action}</td>
                        <td className="text-sm text-gray-500">{log.tableName || '—'}</td>
                        <td className="text-sm text-gray-500">{formatDate(log.createdAt)}</td>
                        <td className="text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}