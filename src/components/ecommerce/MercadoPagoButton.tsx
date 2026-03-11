'use client'

import { useState } from 'react'

export default function MercadoPagoButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout/mp-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar el pago')
      }

      // Redirigir al Checkout Pro (Sandbox o Producción)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('La pasarela no retornó un enlace válido')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handlePayment}
        disabled={loading}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition group ${
          loading 
            ? 'border-blue-300 opacity-70 cursor-wait bg-blue-50' 
            : 'border-blue-500 hover:bg-blue-50 cursor-pointer shadow-md shadow-blue-500/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center p-2">
            <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icono-1024.png" alt="MP" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-900 text-lg">
              {loading ? 'Conectando con el Banco...' : 'Pagar con MercadoPago'}
            </h4>
            <p className="text-xs text-slate-600 font-medium">Débito, Crédito Cuenta RUT o Dinero en cuenta</p>
          </div>
        </div>
        
        {!loading && (
          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        )}
      </button>
      
      {error && (
        <p className="text-red-600 text-sm mt-2 font-bold bg-red-50 p-3 rounded-lg border border-red-200">
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
