"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: number;
  memberId: number | null;
  username: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "idcca_user_session";

// 🔒 Guardamos en localStorage SOLO los datos livianos (sin photoUrl, que puede
// ser una imagen en base64 y ocupar varios MB, causando QuotaExceededError).
type LightUser = Omit<User, "photoUrl">;

function toLightUser(user: User): LightUser {
  const { photoUrl, ...light } = user;
  return light;
}

// Guardado seguro: si por alguna razón igual se llena la cuota, no rompe la app.
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      try {
        localStorage.removeItem(key);
        localStorage.setItem(key, value);
      } catch {
        console.warn("No se pudo guardar el caché de sesión (localStorage lleno).");
      }
    } else {
      console.error("Error al guardar caché de usuario:", e);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ⚡ 1. Persistencia Inmediata + Revalidación en Segundo Plano (Stale-While-Revalidate)
  useEffect(() => {
    const initializeAuth = async () => {
      // PASO A: Cargar instantáneamente desde localStorage (0ms de espera)
      // Nota: photoUrl no está en el caché, por eso puede tardar un instante
      // en aparecer la foto hasta que se revalide con el servidor (Paso B).
      try {
        const cachedUser = localStorage.getItem(STORAGE_KEY);
        if (cachedUser) {
          const light: LightUser = JSON.parse(cachedUser);
          setUser({ ...light, photoUrl: null });
          setLoading(false); // Quita el spinner de carga al instante
        }
      } catch (e) {
        console.error("Error al leer caché de usuario:", e);
      }

      // PASO B: Verificar la sesión real en segundo plano con Neon / Cookies
      try {
        const res = await fetch("/api/auth/me");

        if (!res.ok) {
          // Si el servidor indica que la sesión ya expiró, limpiamos estado
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const data = await res.json();
        if (data?.user) {
          setUser(data.user); // en memoria SÍ va con foto completa
          safeSetItem(STORAGE_KEY, JSON.stringify(toLightUser(data.user)));
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error al revalidar sesión con el servidor:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ⚡ 2. Login ultra fluido con almacenamiento instantáneo
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let errorMessage = "Error al iniciar sesión";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error en el servidor (${res.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Guardar inmediatamente en React State (con foto) y en localStorage (sin foto)
      if (data?.user) {
        setUser(data.user);
        safeSetItem(STORAGE_KEY, JSON.stringify(toLightUser(data.user)));
      }

      return true;
    } catch (error: any) {
      console.error("Error en login:", error);
      throw error;
    }
  };

  // ⚡ 3. Cierre de sesión limpio e inmediato
  const logout = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}