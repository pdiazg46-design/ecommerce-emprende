'use client'

import { useCartStore } from '@/lib/cart-store'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const cart = useCartStore()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Basic Form State (En un caso real se usaría React Hook Form)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  // Para simular la espera de hidratación o carrito real vacío
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Cargando carrito...</div>

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex mx-auto items-center justify-center mb-6 text-3xl">🛒</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-500 mb-8">Parece que aún no has agregado productos a tu compra.</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition block">
            Volver a la Tienda
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
       // Llamada a la API local que procesará la reserva
       const response = await fetch('/api/checkout', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           customer: formData,
           items: cart.items,
           totalAmount: cart.totalAmount
         })
       })
       
       if (response.ok) {
         // Vaciar carro y mostrar éxito
         cart.clearCart()
         alert("¡Pedido realizado con éxito! En breve te contactaremos.") // Simplificado para la beta
         router.push('/')
       } else {
         const err = await response.json()
         alert(err.error || "Hubo un error al procesar tu pedido.")
       }

    } catch (error) {
       alert("Error de red.")
    } finally {
       setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Lado Izquierdo: Resumen del Carrito */}
        <div className="flex-1 space-y-6">
           <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-black text-slate-900">Tu Pedido</h1>
              <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                ← Seguir comprando
              </Link>
           </div>

           <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
             {cart.items.map(item => (
                <div key={item.id} className="flex gap-4 items-center py-4 border-b border-slate-100 last:border-0">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1">
                     <h3 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">{item.name}</h3>
                     <p className="text-blue-600 font-bold">${item.price.toLocaleString('es-CL')}</p>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                     <button 
                       onClick={() => cart.updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                       className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded"
                     >-</button>
                     <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                     <button 
                       onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} // En un caso real limitar por stock aquí también
                       className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded"
                     >+</button>
                  </div>
                  <button 
                    onClick={() => cart.removeItem(item.id)}
                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                     </svg>
                  </button>
                </div>
             ))}
           </div>
        </div>

        {/* Lado Derecho: Checkout y Pago */}
        <div className="w-full lg:w-[400px]">
           <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Datos de Envío</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo</label>
                  <input required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="Patricio Díaz" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                  <input required
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono Whatsapp</label>
                  <input required
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="+56 9 1234 5678" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dirección de Despacho (Solo Región X)</label>
                  <input required
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="Av. Principal 123, Depto 4B" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-3 mb-6">
                 <div className="flex justify-between text-slate-500">
                    <span>Subtotal ({cart.totalItems} items)</span>
                    <span>${cart.totalAmount.toLocaleString('es-CL')}</span>
                 </div>
                 <div className="flex justify-between text-slate-500">
                    <span>Envío</span>
                    <span className="text-emerald-600 font-bold">Por Confirmar</span>
                 </div>
                 <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-100">
                    <span>Total a Pagar</span>
                    <span className="text-blue-600">${cart.totalAmount.toLocaleString('es-CL')}</span>
                 </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition pwa-safe-bottom
                  ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-emerald-700 active:scale-[0.98]'}
                `}
              >
                {isSubmitting ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <span>Confirmar Pedido Seguro</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                    </svg>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-4 leading-tight">
                El pago se coordinará internamente tras la confirmación de inventario para asegurar disponibilidad.
              </p>
           </form>
        </div>
      </div>
    </div>
  )
}
