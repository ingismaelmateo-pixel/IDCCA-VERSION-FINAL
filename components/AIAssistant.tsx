"use client";

import { useState } from "react";
import { Sparkles, Send, Bot, User, TrendingUp, Users, DollarSign, Bell, BarChart3 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "¿Cuántos miembros nuevos hubo este mes?",
  "Genera un resumen de las finanzas del mes",
  "¿Quiénes tienen cumpleaños esta semana?",
  "¿Cuál es el estado de las solicitudes de oración?",
  "Crea un anuncio para la vigilia de este viernes",
  "Dame estadísticas de asistencia de este año",
];

const aiResponses: Record<string, string> = {
  default: "Entiendo tu consulta. Como asistente de ChurchAdmin Pro, puedo ayudarte con información sobre miembros, finanzas, eventos, ministerios y más. ¿En qué puedo asistirte específicamente?",
  miembros: "📊 **Resumen de Membresía:**\n\n• Total miembros activos: **218**\n• Nuevos este mes: **8** (↑12% vs mes anterior)\n• Bautizados este año: **24**\n• Tasa de retención: **94.2%**\n\n⚠️ **Alerta:** 12 miembros no han asistido en más de 4 semanas. Se recomienda visita pastoral.",
  finanzas: "💰 **Resumen Financiero del Mes:**\n\n**Ingresos:**\n• Diezmos: RD$82,000\n• Ofrendas: RD$28,500\n• Donaciones: RD$15,000\n\n**Total Ingresos:** RD$125,500\n**Total Gastos:** RD$68,200\n**Balance:** RD$57,300 ✅\n\n📈 Los diezmos aumentaron 9.3% comparado con el mes anterior. Tendencia positiva.",
  cumpleaños: "🎂 **Cumpleaños esta semana:**\n\n• **Hoy:** María González (15 Nov)\n• **Mañana:** Carlos Méndez (16 Nov)\n• **Vie 17:** Roberto Peña\n• **Dom 19:** Ana Jiménez\n\n💡 *Recomendación:* Enviar mensajes de felicitación por WhatsApp y mencionarlos en el servicio del domingo.",
  oración: "🙏 **Estado de Solicitudes de Oración:**\n\n• Pendientes: **15** (5 urgentes)\n• En proceso: **8**\n• Respondidas este mes: **12**\n• Testimonios registrados: **4**\n\n⚠️ Hay 3 casos que requieren seguimiento pastoral inmediato:\n1. Familia Méndez - situación médica grave\n2. Carlos Ruiz - crisis familiar\n3. Laura Torres - desempleo prolongado",
  anuncio: "📢 **Borrador de Anuncio - Vigilia de Oración:**\n\n---\n✨ **¡NOCHE DE GLORIA!** ✨\n\n🌙 Vigilia de Oración y Adoración\n📅 Viernes, 15 de Noviembre de 2024\n⏰ 10:00 PM - 3:00 AM\n📍 Templo Principal - Av. Principal #123\n\nVen y experimenta la presencia del Señor en una noche de adoración, intercesión y avivamiento.\n\n*\"Clama a mí y yo te responderé\"* - Jeremías 33:3\n\n¡Te esperamos! 🙌\n---\n\n¿Deseas que ajuste el mensaje o agregue información adicional?",
  asistencia: "📊 **Estadísticas de Asistencia 2024:**\n\n| Mes | Dom AM | Dom PM | Miércoles |\n|-----|--------|--------|----------|\n| Ene | 142 | 98 | 65 |\n| Feb | 155 | 108 | 72 |\n| Mar | 163 | 115 | 78 |\n| Abr | 158 | 112 | 75 |\n| May | 171 | 125 | 85 |\n| Jun | 180 | 132 | 90 |\n| Jul | 178 | 130 | 88 |\n| Ago | 185 | 140 | 95 |\n| Sep | 195 | 148 | 102 |\n| Oct | 202 | 155 | 108 |\n| Nov | 215 | 162 | 115 |\n\n📈 **Crecimiento YTD:** +51.4%\n✅ **Tendencia:** Consistentemente al alza",
};

function getAIResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("miembro") || q.includes("member")) return aiResponses.miembros;
  if (q.includes("finanz") || q.includes("diezm") || q.includes("ofrend")) return aiResponses.finanzas;
  if (q.includes("cumpleaño") || q.includes("birthday")) return aiResponses.cumpleaños;
  if (q.includes("oración") || q.includes("oración") || q.includes("prayer")) return aiResponses.oración;
  if (q.includes("anuncio") || q.includes("vigilia") || q.includes("evento")) return aiResponses.anuncio;
  if (q.includes("asistencia") || q.includes("attendance")) return aiResponses.asistencia;
  return aiResponses.default;
}

const aiFeatures = [
  { icon: <Users size={18} />, title: "Análisis de Membresía", desc: "Detecta tendencias y miembros sin seguimiento", color: "#1e3a6e" },
  { icon: <DollarSign size={18} />, title: "Predicción Financiera", desc: "Predice ingresos y detecta variaciones", color: "#c9a84c" },
  { icon: <TrendingUp size={18} />, title: "Reportes Automáticos", desc: "Genera reportes completos con un clic", color: "#10b981" },
  { icon: <Bell size={18} />, title: "Generador de Anuncios", desc: "Crea anuncios y boletines automáticamente", color: "#8b5cf6" },
  { icon: <BarChart3 size={18} />, title: "Tendencias de Asistencia", desc: "Analiza y predice patrones de asistencia", color: "#ef4444" },
  { icon: <Sparkles size={18} />, title: "Resumen de Reuniones", desc: "Resume actas y toma de decisiones", color: "#0891b2" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el Asistente Inteligente de ChurchAdmin Pro. Puedo ayudarte con análisis de miembros, reportes financieros, estadísticas de asistencia, generación de anuncios y mucho más. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { role: "user", content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const response = getAIResponse(messageText);
    const assistantMessage: Message = { role: "assistant", content: response, timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  };

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-bold text-gray-800 mb-1">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.startsWith("• ")) {
        return <p key={i} className="text-gray-700 ml-3">• {line.slice(2)}</p>;
      }
      if (line.startsWith("#")) {
        return <p key={i} className="font-bold text-blue-900 text-base mb-1">{line.replace(/^#+\s/, "")}</p>;
      }
      if (line.includes("**")) {
        return (
          <p key={i} className="text-gray-700">
            {line.split("**").map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      }
      return line ? <p key={i} className="text-gray-700">{line}</p> : <br key={i} />;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <Sparkles size={24} className="text-yellow-500" />
          Asistente con Inteligencia Artificial
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">Powered by AI — Análisis, reportes y recomendaciones inteligentes</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {aiFeatures.map((feature, i) => (
          <div key={i} className="card-premium p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${feature.color}15`, color: feature.color }}>
                {feature.icon}
              </div>
              <h4 className="font-semibold text-sm text-gray-800">{feature.title}</h4>
            </div>
            <p className="text-xs text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="card-premium overflow-hidden" style={{ height: "500px", display: "flex", flexDirection: "column" }}>
        {/* Chat header */}
        <div className="gradient-primary px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <Bot size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Asistente IA ChurchAdmin</p>
            <p className="text-blue-200 text-xs">En línea · Responde al instante</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant" ? "bg-blue-900 text-white" : "bg-yellow-400 text-blue-900"
              }`}>
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "assistant"
                  ? "bg-white shadow-sm border border-gray-100 rounded-tl-none"
                  : "bg-blue-900 text-white rounded-tr-none"
              }`}>
                <div className={`text-sm leading-relaxed space-y-1 ${msg.role === "user" ? "text-white" : ""}`}>
                  {msg.role === "assistant" ? formatMessage(msg.content) : <p>{msg.content}</p>}
                </div>
                <p className={`text-xs mt-1.5 ${msg.role === "assistant" ? "text-gray-400" : "text-blue-200"}`}>
                  {msg.timestamp.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        <div className="px-4 py-2 border-t border-gray-100 bg-white">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap transition-colors border border-blue-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Pregunta algo sobre la iglesia..."
              className="input-field flex-1 text-sm"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn-primary w-10 h-10 p-0 flex items-center justify-center rounded-xl disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
