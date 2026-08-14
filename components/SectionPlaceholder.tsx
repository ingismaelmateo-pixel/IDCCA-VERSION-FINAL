"use client";

import { Construction } from "lucide-react";

interface SectionPlaceholderProps {
  title: string;
  description: string;
  icon?: string;
}

const features = [
  "📊 Panel de control con métricas en tiempo real",
  "📝 Formularios completos con validación",
  "🔍 Búsqueda y filtros avanzados",
  "📄 Exportación a PDF y Excel",
  "📱 Diseño 100% responsive",
  "🔔 Notificaciones automáticas",
];

export default function SectionPlaceholder({ title, description, icon = "🚧" }: SectionPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-900">{title}</h2>
        <p className="text-gray-400 text-sm mt-0.5">{description}</p>
      </div>

      <div className="card-premium p-12 text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-blue-900 mb-2">Módulo en Desarrollo</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          Este módulo está siendo desarrollado con todas las funcionalidades descritas. 
          Estará disponible próximamente con una interfaz completa y funcional.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="p-3 rounded-xl bg-blue-50 text-left">
              <p className="text-xs text-blue-800 font-medium">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
