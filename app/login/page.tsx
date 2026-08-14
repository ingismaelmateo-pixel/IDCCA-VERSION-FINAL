"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Church } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // 🚀 PRECARGA RÁPIDA: Precarga la ruta del dashboard para que el cambio de pantalla sea instantáneo
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      // 🔥 Usamos replace en lugar de push para acelerar el cambio y no saturar el historial
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Credenciales incorrectas");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      
      {/* Decoración de fondo (Blobs animados) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />

      {/* Tarjeta de Login */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 overflow-hidden">
        
        {/* Indicador de borde superior con degradado */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-500" />

        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-white/20 blur-sm group-hover:blur-md transition-all" />
            <Church size={36} className="text-white relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IDCCA</h1>
          <p className="text-blue-200/80 text-sm mt-1 font-medium">Iglesia de Dios Comunitaria Centro de Adoracion</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl backdrop-blur-sm text-center font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {/* Campo Usuario */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-200/80 ml-1">Usuario</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-blue-300/60 group-focus-within:text-blue-300 transition-colors" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="ej. pastor.juan"
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-blue-200/80 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-blue-300/60 group-focus-within:text-blue-300 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300/60 hover:text-blue-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón de Acción */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-500/25 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-blue-300/50 text-xs">
            Sistema de Gestión Eclesiástica v2.0
          </p>
        </div>
      </div>
    </div>
  );
}