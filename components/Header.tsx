"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, Moon, Sun, Settings, LogOut, ChevronDown, Check, X, AlertCircle, Clock, User, BellRing, BellOff, UserCog } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
  onNavigate: (id: string) => void;
}

interface Notification {
  id: string;
  text: string;
  time: string;
  type: 'warning' | 'success' | 'info' | 'error';
  read: boolean;
}

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard Principal",
  "members-list": "Lista de Miembros",
  "members-add": "Agregar Miembro",
  "members-family": "Árbol Familiar",
  visitors: "Visitantes",
  ministries: "Ministerios",
  "bible-school": "Escuela Bíblica",
  sermons: "Sermones",
  library: "Biblioteca",
  events: "Eventos",
  attendance: "Asistencia",
  pastoral: "Agenda Pastoral",
  finance: "Gestión Financiera",
  "finance-tithes": "Diezmos",
  "finance-offerings": "Ofrendas",
  "finance-donations": "Donaciones",
  "finance-expenses": "Gastos",
  "finance-budgets": "Presupuestos",
  "finance-reports": "Reportes Financieros",
  treasury: "Tesorería",
  inventory: "Inventario",
  hr: "Recursos Humanos",
  prayer: "Oraciones",
  counseling: "Consejería",
  communication: "Comunicación",
  announcements: "Anuncios",
  reports: "Reportes",
  documents: "Gestión Documental",
  ai: "Asistente IA",
  settings: "Configuración",
};

// ✅ Notificaciones de ejemplo
const defaultNotifications: Notification[] = [
  { id: '1', text: '3 solicitudes de oración pendientes de respuesta', time: '5 min', type: 'warning', read: false },
  { id: '2', text: 'Nuevo miembro registrado: María López', time: '1 hora', type: 'success', read: false },
  { id: '3', text: 'Vigilia especial esta noche a las 10 PM', time: '2 horas', type: 'info', read: false },
  { id: '4', text: 'Diezmo de $1,500 pendiente de verificación', time: '3 horas', type: 'warning', read: false },
  { id: '5', text: '5 cumpleaños esta semana', time: '1 día', type: 'info', read: false },
  { id: '6', text: 'Reunión de líderes pospuesta para el sábado', time: '1 día', type: 'error', read: false },
];

const typeColors: Record<string, string> = {
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  info: 'bg-blue-500',
  error: 'bg-red-500',
};

export default function Header({ title, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  
  // ✅ Estado del tema (modo oscuro)
  const [darkMode, setDarkMode] = useState(false);
  
  // ✅ Notificaciones
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ✅ Cargar tema del localStorage al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // ✅ Manejador del modo oscuro
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // ✅ Manejador para cerrar menús
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ✅ Marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ✅ Marcar una notificación como leída
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // ✅ Eliminar una notificación
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ✅ Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  // ✅ Formatear Nombre
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.username || "Usuario";

  // ✅ Iniciales
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.username?.slice(0, 2) || "U").toUpperCase();

  return (
    <header className={`page-header flex items-center justify-between gap-4 px-4 py-3 border-b transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      {/* Title */}
      <div className="hidden lg:block min-w-[200px]">
        <h1 className={`font-bold text-lg tracking-tight transition-colors duration-300 ${
          darkMode ? 'text-blue-400' : 'text-blue-900'
        }`}>
          {sectionTitles[title] || title}
        </h1>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20' 
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
            } focus:outline-none`}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* ✅ Modo Oscuro/Claro */}
        <button
          onClick={toggleDarkMode}
          aria-label="Alternar modo oscuro"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${
            darkMode 
              ? 'text-amber-400 hover:bg-gray-700' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        {/* ✅ Notificaciones */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="Ver notificaciones"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 relative ${
              darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className={`p-3.5 border-b flex items-center justify-between ${
                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'
              }`}>
                <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Notificaciones
                </h4>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 font-medium hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    <Check size={12} /> Marcar todas
                  </button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.length === 0 ? (
                  <div className={`p-8 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <BellOff size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay notificaciones</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3 cursor-pointer group ${
                        !notif.read ? (darkMode ? 'bg-gray-700/30' : 'bg-blue-50/50') : ''
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${typeColors[notif.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {notif.text}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-gray-400">Hace {notif.time}</p>
                          {!notif.read && (
                            <span className="text-[10px] text-blue-500 font-medium">● Nuevo</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* ✅ "Ver todas las notificaciones" - RESTAURADO */}
              {notifications.length > 0 && (
                <div className={`p-2.5 text-center border-t ${
                  darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/30'
                }`}>
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate("notifications");
                    }}
                    className={`text-xs font-semibold transition-colors ${
                      darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => onNavigate("settings")}
          aria-label="Ir a Configuración"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${
            darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Settings size={17} />
        </button>

        {/* ✅ Profile - CON "Mi Perfil" restaurado */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-label="Menú de usuario"
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors focus:outline-none ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
              }`}>
                {initials}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className={`text-xs font-semibold leading-none ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {displayName}
              </p>
              <p className={`text-[11px] capitalize mt-0.5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {user?.role || "Usuario"}
              </p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`} />
          </button>

          {showProfile && (
            <div className={`absolute right-0 top-12 w-56 rounded-2xl shadow-xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className={`p-3.5 border-b ${
                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'
              }`}>
                <p className={`font-semibold text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {displayName}
                </p>
                <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {user?.email || "Sin email registrado"}
                </p>
              </div>
              <div className="p-1.5">
                {/* ✅ "Mi Perfil" - RESTAURADO */}
                <button
                  onClick={() => {
                    setShowProfile(false);
                    onNavigate("profile");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <User size={15} className="text-gray-400" /> Mi Perfil
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    onNavigate("settings");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2.5 transition-colors ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Settings size={15} className="text-gray-400" /> Configuración
                </button>
                <div className={`my-1 mx-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2.5 transition-colors"
                >
                  <LogOut size={15} className="text-red-500" /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}