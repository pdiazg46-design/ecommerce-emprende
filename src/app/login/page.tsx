'use client'

export default function LoginPage() {
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
