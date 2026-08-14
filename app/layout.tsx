"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientSidebarWrapper from "@/components/ClientSidebarWrapper";
import Header from "@/components/Header"; // 🔥 ESTO ES LO QUE FALTABA
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#f0f4fc] text-gray-800`}>
        <AuthProvider>
          
          {/* PÁGINA DE LOGIN */}
          {isLoginPage ? (
            <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
              {children}
            </main>
          ) : (
            
            /* LAYOUT COMPLETO CON SIDEBAR Y HEADER */
            <div className="flex h-screen w-full overflow-hidden relative bg-[#f0f4fc]">
              
              {/* 1. SIDEBAR */}
              <ClientSidebarWrapper />
              
              {/* 2. CONTENEDOR DERECHO */}
              <div className="flex-1 flex flex-col h-screen overflow-hidden ml-64 relative">
                
                {/* 3. HEADER (EL QUE TIENE TU NOMBRE ARRIBA) */}
                <div className="flex-shrink-0 sticky top-0 z-30">
                  <Header title="Dashboard" onNavigate={() => {}} />
                </div>

                {/* 4. CONTENIDO (Dashboard, Biblioteca, etc) */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#f0f4fc] relative">
                  <div className="max-w-7xl mx-auto w-full">
                    {children}
                  </div>
                </main>

              </div>
            </div>
          )}

        </AuthProvider>
      </body>
    </html>
  );
}