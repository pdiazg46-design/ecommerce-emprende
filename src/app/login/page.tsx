'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    // El Magic Link de Supabase pone el token en el Hash de la URL, 
    // lo cual el servidor (Render) no puede ver, pero el cliente sí.
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        setIsAuthenticating(true)
        
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Escuchar el evento cuando el SDK atrapa el hash de la URL y consolida la cookie
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                // Ya tenemos sesión viva web, entramos al centro de control
                router.push('/admin/ventas')
                router.refresh()
            }
        })

        return () => subscription.unsubscribe()
    }
  }, [router])

  if (isAuthenticating) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-900 animate-pulse">Sincronizando Identidad Segura...</h2>
            <p className="text-slate-500 mt-2">Estableciendo enlace con The Cloud</p>
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
