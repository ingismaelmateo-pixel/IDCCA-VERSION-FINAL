"use client"; // 👈 OBLIGATORIO para usar useState

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function ClientSidebarWrapper() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleNavigate = (id: string) => {
    setActiveSection(id);
  };

  return (
    <Sidebar 
      activeSection={activeSection} 
      onNavigate={handleNavigate} 
    />
  );
}