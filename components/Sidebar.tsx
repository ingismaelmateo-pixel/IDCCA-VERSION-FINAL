"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Heart,
  BookOpen,
  Calendar,
  DollarSign,
  Package,
  Library,
  Mic2,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Landmark,
  UsersRound,
  HandHeart,
  BarChart3,
  Baby,
  Church,
  Cross,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: string;
  children?: { label: string; id: string; roles?: string[] }[];
  roles?: string[]; 
}

const routeMap: Record<string, string> = {
  dashboard: "/dashboard",
  "members-list": "/miembros",
  "members-add": "/miembros/agregar",
  "members-family": "/miembros/familia",
  visitors: "/visitantes",
  ministries: "/ministerios",
  "bible-school": "/escuela-biblica",
  "sunday-school": "/escuela-dominical",
  sermons: "/sermones",
  library: "/biblioteca",
  events: "/eventos",
  attendance: "/asistencia",
  pastoral: "/agenda-pastoral",
  finance: "/finanzas",
  treasury: "/tesoreria",
  inventory: "/inventario",
  hr: "/rrhh",
  prayer: "/oraciones",
  counseling: "/consejeria",
  communication: "/comunicacion",
  announcements: "/anuncios",
  reports: "/reportes",
  documents: "/documentos",
  ai: "/ia-asistente",
  settings: "/configuracion",
};

const navGroups = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={16} />, id: "dashboard", roles: ["admin", "pastor", "secretary", "treasurer", "leader", "teacher", "reception", "user"] },
    ],
  },
  {
    title: "Congregación",
    items: [
      {
        label: "Miembros",
        icon: <Users size={16} />,
        id: "members",
        roles: ["admin", "pastor", "secretary", "leader"],
        children: [
          { label: "Lista de Miembros", id: "members-list" },
          { label: "Agregar Miembro", id: "members-add" },
          { label: "Árbol Familiar", id: "members-family" },
        ],
      },
      { label: "Visitantes", icon: <UserPlus size={16} />, id: "visitors", roles: ["admin", "pastor", "secretary"] },
      { label: "Ministerios", icon: <UsersRound size={16} />, id: "ministries", roles: ["admin", "pastor", "leader"] },
    ],
  },
  {
    title: "Formación",
    items: [
      { label: "Escuela Bíblica", icon: <BookOpen size={16} />, id: "bible-school", roles: ["admin", "pastor", "teacher"] },
      { label: "Sermones", icon: <Mic2 size={16} />, id: "sermons", roles: ["admin", "pastor", "user"] },
      { label: "Biblioteca", icon: <Library size={16} />, id: "library", roles: ["admin", "pastor", "user"] },
    ],
  },
  {
    title: "Infancia",
    items: [
      { label: "Escuela Dominical", icon: <Baby size={16} />, id: "sunday-school", roles: ["admin", "pastor", "teacher"] },
    ],
  },
  {
    title: "Actividades",
    items: [
      { label: "Eventos", icon: <Calendar size={16} />, id: "events", roles: ["admin", "pastor", "user"] },
      { label: "Asistencia", icon: <BookOpen size={16} />, id: "attendance", roles: ["admin", "pastor", "secretary"] },
      { label: "Agenda Pastoral", icon: <Church size={16} />, id: "pastoral", roles: ["admin", "pastor"] },
    ],
  },
  {
    title: "Finanzas",
    items: [
      {
        label: "Finanzas",
        icon: <DollarSign size={16} />,
        id: "finance",
        roles: ["admin", "pastor", "treasurer"],
        children: [
          { label: "Gestión Financiera", id: "finance" },
          { label: "Tesorería", id: "treasury" },
        ],
      },
    ],
  },
  {
    title: "Recursos",
    items: [
      { label: "Inventario", icon: <Package size={16} />, id: "inventory", roles: ["admin", "pastor"] },
      { label: "Recursos Humanos", icon: <Users size={16} />, id: "hr", roles: ["admin"] },
    ],
  },
  {
    title: "Pastoral",
    items: [
      { label: "Oraciones", icon: <HandHeart size={16} />, id: "prayer", roles: ["admin", "pastor", "user"] },
      { label: "Consejería", icon: <Heart size={16} />, id: "counseling", roles: ["admin", "pastor"] },
      { label: "Comunicación", icon: <MessageSquare size={16} />, id: "communication", roles: ["admin", "pastor", "secretary"] },
    ],
  },
  {
    title: "Reportes",
    items: [
      { label: "Anuncios", icon: <Bell size={16} />, id: "announcements", roles: ["admin", "pastor", "secretary"] },
      { label: "Reportes", icon: <BarChart3 size={16} />, id: "reports", roles: ["admin", "pastor", "treasurer"] },
      { label: "Documentos", icon: <FileText size={16} />, id: "documents", roles: ["admin", "pastor", "secretary"] },
      { label: "IA Asistente", icon: <Sparkles size={16} />, id: "ai", roles: ["admin", "pastor"] },
    ],
  },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth(); 
  
  const [expandedItems, setExpandedItems] = useState<string[]>(['members', 'finance']);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = user?.role || "user";

  useEffect(() => {
    const currentPath = pathname || '';
    const groupsToExpand = ['members', 'finance'];
    
    if (currentPath.includes('/miembros')) groupsToExpand.push('members');
    if (currentPath.includes('/finanzas')) groupsToExpand.push('finance');
    if (currentPath.includes('/tesoreria')) groupsToExpand.push('finance');
    if (currentPath.includes('/escuela-biblica')) groupsToExpand.push('bible-school');
    if (currentPath.includes('/biblioteca')) groupsToExpand.push('bible-school'); // 🔥 NUEVO: Expande Formación cuando estés en Biblioteca
    if (currentPath.includes('/escuela-dominical')) groupsToExpand.push('sunday-school');
    if (currentPath.includes('/rrhh')) groupsToExpand.push('hr');
    
    setExpandedItems(prev => {
      const newItems = [...prev];
      groupsToExpand.forEach(group => {
        if (!newItems.includes(group)) newItems.push(group);
      });
      return newItems;
    });
  }, [pathname]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNavigate = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
    const path = routeMap[id];
    if (path) router.push(path);
  };

  const isActivePath = (id: string) => {
    const path = routeMap[id];
    if (!path) return false;
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const isItemActive = (item: NavItem) => {
    if (isActivePath(item.id)) return true;
    if (activeSection === item.id) return true;
    if (item.children) {
      return item.children.some((child) => {
        if (isActivePath(child.id)) return true;
        return activeSection === child.id;
      });
    }
    return false;
  };

  const hasAccess = (item: NavItem) => {
    if (!item.roles) return true; 
    return item.roles.includes(userRole);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">✝</span>
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">IDCCA</div>
            <div className="text-yellow-400/70 text-xs font-medium">Pro Sistema</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(hasAccess);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-1">
              <p className="nav-group-title">{group.title}</p>
              {visibleItems.map((item) => (
                <div key={item.id}>
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        className={`nav-item w-full justify-between ${
                          isItemActive(item) ? "active" : ""
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            expandedItems.includes(item.id) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedItems.includes(item.id) && (
                        <div className="ml-7 mt-0.5 space-y-0.5">
                          {item.children.filter((child: any) => !child.roles || child.roles.includes(userRole)).map((child: any) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleNavigate(child.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 block ${
                                isActivePath(child.id) || activeSection === child.id
                                  ? "text-yellow-300 bg-white/10 font-medium"
                                  : "text-white/55 hover:text-white/80 hover:bg-white/5"
                              }`}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`nav-item w-full text-left flex items-center gap-3 ${
                        isItemActive(item) ? "active" : ""
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 mt-auto">
        <button
          type="button"
          className={`nav-item w-full text-left flex items-center gap-3 ${
            isActivePath("settings") || activeSection === "settings" ? "active" : ""
          }`}
          onClick={() => handleNavigate("settings")}
        >
          <Settings size={16} />
          <span>Configuración</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-lg"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-72 sidebar z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </div>

      <div className="hidden lg:flex flex-col w-64 sidebar fixed left-0 top-0 h-full z-30 flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}