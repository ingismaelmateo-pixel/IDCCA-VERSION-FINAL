"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import Members from "@/components/Members";
import FamilyTree from "@/components/FamilyTree";
import Ministries from "@/components/Ministries";
import Events from "@/components/Events";
import Finance from "@/components/Finance";
import Visitors from "@/components/Visitors";
import Prayer from "@/components/Prayer";
import Sermons from "@/components/Sermons";
import Inventory from "@/components/Inventory";
import AIAssistant from "@/components/AIAssistant";
import AnnouncementsSection from "@/components/Announcements";
import Reports from "@/components/Reports";
import SectionPlaceholder from "@/components/SectionPlaceholder";

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "members":
      case "members-list":
        return <Members />;
      case "members-add":
        return <Members />;
      case "members-family":
        return <FamilyTree />;
      case "visitors":
        return <Visitors />;
      case "ministries":
        return <Ministries />;
      case "bible-school":
        return (
          <SectionPlaceholder
            title="Escuela Bíblica"
            description="Gestión de clases, maestros, alumnos, calificaciones y certificados"
            icon="📖"
          />
        );
      case "sermons":
        return <Sermons />;
      case "library":
        return (
          <SectionPlaceholder
            title="Biblioteca"
            description="Gestión de libros, Biblias, préstamos y devoluciones"
            icon="📚"
          />
        );
      case "events":
        return <Events />;
      case "attendance":
        return (
          <SectionPlaceholder
            title="Control de Asistencia"
            description="Registro de asistencia por culto, ministerio y evento"
            icon="✅"
          />
        );
      case "pastoral":
        return (
          <SectionPlaceholder
            title="Agenda Pastoral"
            description="Calendario de visitas, consejerías, bodas, funerales y reuniones"
            icon="⛪"
          />
        );
      case "finance":
      case "finance-tithes":
      case "finance-offerings":
      case "finance-donations":
      case "finance-expenses":
      case "finance-budgets":
      case "finance-reports":
        return <Finance section={activeSection} />;
      case "treasury":
        return (
          <SectionPlaceholder
            title="Tesorería"
            description="Caja diaria, apertura, cierre, arqueo y conciliaciones"
            icon="🏦"
          />
        );
      case "inventory":
        return <Inventory />;
      case "hr":
        return (
          <SectionPlaceholder
            title="Recursos Humanos"
            description="Gestión de pastores, líderes, empleados y voluntarios"
            icon="👥"
          />
        );
      case "prayer":
        return <Prayer />;
      case "counseling":
        return (
          <SectionPlaceholder
            title="Consejería"
            description="Consejería matrimonial, juvenil, familiar y espiritual con seguimiento privado"
            icon="💬"
          />
        );
      case "communication":
        return (
          <SectionPlaceholder
            title="Comunicación"
            description="Chat interno, mensajería, notificaciones, correo, SMS y WhatsApp"
            icon="📱"
          />
        );
      case "announcements":
        return <AnnouncementsSection />;
      case "reports":
        return <Reports />;
      case "documents":
        return (
          <SectionPlaceholder
            title="Gestión Documental"
            description="Actas, estatutos, contratos, certificados e informes con control de versiones"
            icon="📄"
          />
        );
      case "ai":
        return <AIAssistant />;
      case "settings":
        return (
          <SectionPlaceholder
            title="Configuración del Sistema"
            description="Roles, permisos, seguridad, autenticación de dos factores y bitácora"
            icon="⚙️"
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Header */}
        <Header title={activeSection} onNavigate={setActiveSection} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pt-4">
          <div className="max-w-screen-2xl mx-auto">
            {renderSection()}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 bg-white mt-4">
          <p>ChurchAdmin Pro © {new Date().getFullYear()} — Sistema de Gestión Eclesiástica Premium</p>
          <p className="mt-0.5">Versión 2.0.0 · Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
}