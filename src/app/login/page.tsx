'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // El Magic Link de Supabase pone el token en el Hash de la URL, 
    // lo cual el servidor (Render) no puede ver, pero el cliente sí.
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        setIsAuthenticating(true)
        setAuthError(null)
        
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Forzar extracción explícita y manual del Hash de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            }).then(({ error }) => {
                if (error) {
                    setAuthError("Fallo interno al inyectar tu llave de acceso: " + error.message);
                    setIsAuthenticating(false);
                } else {
                    // Hard-reload forzado para que el Middleware de servidor procese la nueva Cookie 
                    window.location.href = '/admin/ventas';
                }
            }).catch(err => {
                setAuthError("Error Crítico de inyección: " + String(err));
                setIsAuthenticating(false);
            });
        } else {
            setAuthError("La llave de acceso está corrupta o incompleta en la URL.");
            setIsAuthenticating(false);
        }
    }
  }, [router])

  if (authError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 border-4 border-rose-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20">
                <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Enlace de Acceso Inválido</h2>
            <p className="text-rose-500 font-medium bg-rose-50 px-4 py-2 rounded-lg max-w-sm">{authError}</p>
            <button 
                onClick={() => window.location.href = '/login'} 
                className="mt-8 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
            >
                Entendido
            </button>
        </div>
      )
  }

  if (isAuthenticating) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 shadow-lg shadow-blue-500/20"></div>
            <h2 className="text-xl font-black text-slate-900 animate-pulse">Sincronizando Identidad Segura...</h2>
            <p className="text-slate-500 mt-2 font-medium">Estableciendo enlace de sesiones cruzadas</p>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Espacio para Logo */}
        <div className="mx-auto w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-6">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
             <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
           </svg>
        </div>

        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight mb-2">
          Acceso Restringido
        </h2>
        
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-100 relative overflow-hidden text-center mt-8">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <p className="text-slate-600 font-medium mb-6">
                El panel de administración del E-commerce ahora es un módulo exclusivo del ecosistema <strong>Emprende POS</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-8">
                Para gestionar tu tienda, inventario y ventas online, debes iniciar sesión desde tu terminal principal y acceder a través del menú lateral.
            </p>

            <button
                onClick={() => {
                   const targetUrl = process.env.NEXT_PUBLIC_POS_URL || "https://emprende-atsit.vercel.app";
                   window.location.href = targetUrl;
                }}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
                Ir a Emprende POS
            </button>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Sistema Híbrido Protegido • Ecosistema Emprende
        </p>
      </div>
    </div>
  )
}
