'use client'

import { useCartStore } from '@/lib/cart-store'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { REGIONES_CHILE } from '@/lib/chile-data'

export default function CartPage() {
  const cart = useCartStore()
  const router = useRouter()
  const items = cart.items
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const params = useParams()
  // Limpiamos el store slug desde params del router
  const storeSlug = typeof params.storeSlug === 'string' 
     ? decodeURIComponent(params.storeSlug).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
     : ''
     
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false) // Nuevo estado antidesmontaje
  const [shippingCoverage, setShippingCoverage] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
    comuna: '',
    address: ''
  })

  const isCoverageValid = () => {
    if (shippingCoverage.length === 0 || shippingCoverage.includes('Todo Chile')) return true;
    if (shippingCoverage.includes(`Región ${formData.region}`)) return true;
    if (shippingCoverage.includes(formData.comuna)) return true;
    return false;
  }

  const hasCoverage = isCoverageValid();
  const showAddress = formData.region && formData.comuna && hasCoverage;
  const showError = formData.region && formData.comuna && !hasCoverage;

  // Para simular la espera de hidratación o carrito real vacío
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    if (storeSlug) {
      fetch(`/api/store-info/${storeSlug}`)
        .then(res => res.json())
        .then(data => {
           if (data && data.shippingCoverage) {
              setShippingCoverage(data.shippingCoverage)
           }
        })
        .catch(err => console.error("Error fetching coverage in cart:", err))
    }
  }, [storeSlug])

  if (!mounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Cargando carrito...</div>

  // Si no hay tems, Y NO TAMOS saliendo al Banco, mostramos carrito vacío
  if (cart.items.length === 0 && !isFinishing) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex mx-auto items-center justify-center mb-6 text-3xl">🛒</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-500 mb-8">Parece que aún no has agregado productos a tu compra.</p>
          <Link href={`/${storeSlug}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition block">
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
           items: items,
           totalAmount: totalAmount
         })
       })
       
       if (response.ok) {
         const data = await response.json()
         
         setIsFinishing(true) // CONGELA LA INTERFAZ ANTES DEL SALT O Y LIMPIEZA
         
         // Redirigir a la URL Segura de Pagos
         if(data.paymentUrl) {
           router.push(data.paymentUrl)
           // Limpieza retrasada para dar tiempo a q se cierre la pestaña actual
           setTimeout(() => cart.clearCart(), 1500)
         } else {
           // Fallback histórico
           router.push(`/${storeSlug}`)
           setTimeout(() => cart.clearCart(), 800)
         }
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
              <Link href={`/${storeSlug}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
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
        <div className="w-full lg:w-[500px] xl:w-[550px]">
           <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Datos de Envío</h2>
              
              {shippingCoverage.length > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-3">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-700 shrink-0">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                   </svg>
                   <div>
                     <p className="text-[11px] text-blue-800 leading-snug">
                        Solo envíos a: <strong className="font-bold text-blue-950">{shippingCoverage.join(' | ')}</strong>
                     </p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo</label>
                  <input required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="Patricio Díaz" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                  <input required
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono Whatsapp</label>
                  <input required
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="+56 9 1234 5678" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Región</label>
                  <select required
                    value={formData.region} 
                    onChange={e => setFormData({...formData, region: e.target.value, comuna: ''})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                     <option value="">Selecciona...</option>
                     {REGIONES_CHILE.map(r => (
                        <option key={r.region} value={r.region}>{r.region}</option>
                     ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Comuna</label>
                  <select required
                    value={formData.comuna} 
                    disabled={!formData.region}
                    onChange={e => setFormData({...formData, comuna: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
                  >
                     <option value="">Selecciona...</option>
                     {formData.region && REGIONES_CHILE.find(r => r.region === formData.region)?.comunas.map(c => (
                        <option key={c} value={c}>{c}</option>
                     ))}
                  </select>
                </div>

                {showError && (
                   <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium flex items-start gap-2 animate-fade-in shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Lo sentimos, sin cobertura en {formData.comuna}. Contacta al vendedor.
                   </div>
                )}

                {showAddress && (
                  <div className="sm:col-span-2 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Dirección Exacta de Despacho</label>
                    <input required
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                      type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="Av. Principal 123, Depto 4B" />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2 mb-4">
                 <div className="flex justify-between text-slate-500 text-sm">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${totalAmount.toLocaleString('es-CL')}</span>
                 </div>
                 <div className="flex justify-between text-slate-500 text-sm">
                    <span>Envío</span>
                    <span className="text-emerald-600 font-bold">Por Confirmar</span>
                 </div>
                 <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-blue-600">${totalAmount.toLocaleString('es-CL')}</span>
                 </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || showError || !showAddress}
                className={`w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition pwa-safe-bottom
                  ${(isSubmitting || showError || !showAddress) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-emerald-700 active:scale-[0.98]'}
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
