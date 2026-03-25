/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function AdminVentas() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'SENT' | 'ARCHIVED'>('ALL')

  // Estado del Modal de Despacho
  const [shippingModalData, setShippingModalData] = useState<{ id: string, courierName: string, trackingNumber: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/admin/orders')
        if (!res.ok) {
           const errData = await res.json()
           throw new Error(errData.error || `Error ${res.status}`)
        }
        const data = await res.json()
        setOrders(data.orders || [])
      } catch (err) {
        const error = err as Error;
        setError(error.message || String(error))
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
     if(newStatus === 'SENT' && !shippingModalData) {
         // Si quiere marcar como SENT, primero abrimos el modal pasándole los datos básicos
         setShippingModalData({ id: orderId, courierName: '', trackingNumber: '' })
         return
     }

     setIsSaving(true)
     try {
       const res = await fetch('/api/admin/orders', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           orderId,
           status: newStatus,
           ...(shippingModalData && {
               courierName: shippingModalData.courierName,
               trackingNumber: shippingModalData.trackingNumber
           }),
           ...(newStatus === 'PAID' && !shippingModalData && { // Si vuelve a PAID, limpiamos el despacho
               courierName: null,
               trackingNumber: null
           })
         })
       })

       if (!res.ok) throw new Error('Fallo al actualizar')
       
       setOrders(prev => prev.map(o => 
         o.id === orderId 
           ? { 
               ...o, 
               status: newStatus,
               ...(shippingModalData && {
                   courierName: shippingModalData.courierName,
                   trackingNumber: shippingModalData.trackingNumber
               }),
               ...(newStatus === 'PAID' && !shippingModalData && {
                   courierName: null,
                   trackingNumber: null
               })
             } 
           : o
       ))
       setShippingModalData(null)
     } catch (err: any) {
       alert(err.message)
     } finally {
       setIsSaving(false)
     }
  }

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'ALL') return o.status !== 'PENDING' && o.status !== 'PENDING_PAYMENT' && o.status !== 'ARCHIVED'
    if (filterStatus === 'PENDING') return o.status === 'PENDING' || o.status === 'PENDING_PAYMENT'
    return o.status === filterStatus
  })

  const stats = { 
    total: orders.filter(o => o.status !== 'PENDING' && o.status !== 'PENDING_PAYMENT').length, 
    pending: orders.filter(o => o.status === 'PENDING' || o.status === 'PENDING_PAYMENT').length,
    paid: orders.filter(o => o.status === 'PAID').length,
    sent: orders.filter(o => o.status === 'SENT').length,
    archived: orders.filter(o => o.status === 'ARCHIVED').length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Pendiente de Pago</span>
      case 'PAID':
         return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Pagado / Preparar</span>
      case 'SENT':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Despachado</span>
      default:
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center">
                 <img src="/logo_atsit.png" alt="AT-SIT Integración Tecnológica" className="h-[46px] w-auto object-contain" />
              </div>
              
              <div className="flex flex-col border-l border-slate-300 dark:border-slate-700 pl-6">
                 <span className="text-2xl font-black tracking-widest text-[#4A87FF] leading-none my-1">EMPRENDE</span>
              </div>
              
              <button 
                 onClick={handleLogout}
                 className="ml-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center group"
                 title="Cerrar Sesión"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
              </button>
            </div>
            
            <div className="text-right flex items-center gap-4">
              <Link href="/admin/catalogo" className="text-sm font-semibold text-slate-300 hover:text-white transition">
                 ← Volver al Catálogo
              </Link>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">BackOffice de Ventas</h1>
            <p className="text-slate-500 font-medium">Gestiona y despacha los pedidos que entran desde tu E-commerce.</p>
          </div>
        </div>

        {/* Panel de Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 justify-between flex-row flex rounded-xl border border-slate-200 shadow-sm cursor-pointer" onClick={() => setFilterStatus('ALL')}>
             <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Total Histórico</p>
                <p className="text-3xl font-black text-slate-900">{stats.total}</p>
             </div>
             <div className="text-slate-200"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg></div>
          </div>
          <div className={`bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm cursor-pointer transition-transform ${filterStatus === 'PENDING' ? 'ring-2 ring-amber-400' : 'hover:-translate-y-1'}`} onClick={() => setFilterStatus('PENDING')}>
             <p className="text-sm font-bold text-amber-700 mb-1">Esperando Pago</p>
             <p className="text-3xl font-black text-amber-900">{stats.pending}</p>
          </div>
          <div className={`bg-emerald-50 p-5 rounded-xl border border-emerald-200 shadow-sm cursor-pointer transition-transform ${filterStatus === 'PAID' ? 'ring-2 ring-emerald-400' : 'hover:-translate-y-1'}`} onClick={() => setFilterStatus('PAID')}>
             <p className="text-sm font-bold text-emerald-700 mb-1">Para Despachar</p>
             <p className="text-3xl font-black text-emerald-900">{stats.paid}</p>
          </div>
          <div className={`bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm cursor-pointer transition-transform ${filterStatus === 'SENT' ? 'ring-2 ring-blue-400' : 'hover:-translate-y-1'}`} onClick={() => setFilterStatus('SENT')}>
             <p className="text-sm font-bold text-blue-700 mb-1">Despachados</p>
             <p className="text-3xl font-black text-blue-900">{stats.sent}</p>
          </div>
          <div className={`bg-slate-50 p-5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-transform ${filterStatus === 'ARCHIVED' ? 'ring-2 ring-slate-400' : 'hover:-translate-y-1'}`} onClick={() => setFilterStatus('ARCHIVED')}>
             <p className="text-sm font-bold text-slate-500 mb-1">Archivados</p>
             <p className="text-3xl font-black text-slate-800">{stats.archived}</p>
          </div>
        </div>

        {/* Listado de Pedidos */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center font-bold">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
             <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No hay ventas que mostrar</h3>
             <p className="text-slate-500 border-b border-transparent">Tus clientes aún no han generado pedidos en esta categoría.</p>
          </div>
        ) : filterStatus === 'ARCHIVED' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contenido</th>
                  <th className="px-4 py-3">Despacho</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                       <span className="block text-xs font-bold text-slate-800">#{order.id.slice(-6).toUpperCase()}</span>
                       <span className="block text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString('es-CL')}</span>
                    </td>
                    <td className="px-4 py-3">
                       <span className="block font-bold text-slate-800">{order.customerName}</span>
                       <span className="block text-xs text-slate-500">{order.customerEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                       <span className="block text-xs text-slate-600 truncate max-w-[200px]" title={order.items.map((it:any) => `${it.quantity}x ${it.product?.name}`).join(', ')}>
                         {order.items.map((it:any) => `${it.quantity}x ${it.product?.name}`).join(', ')}
                       </span>
                    </td>
                    <td className="px-4 py-3">
                       <span className="block text-xs font-bold text-slate-700">{order.shippingAddress || 'Retiro'}</span>
                       {order.trackingNumber && <span className="block text-[10px] text-slate-500">{order.courierName}: {order.trackingNumber}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">
                       ${order.totalAmount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-center">
                       <button onClick={() => handleStatusChange(order.id, 'SENT')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 transition-colors">
                          Desarchivar
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => (
               <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                     <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                           {new Date(order.createdAt).toLocaleDateString('es-CL')} - {new Date(order.createdAt).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <h3 className="font-black text-slate-900 text-lg leading-tight flex items-center gap-2">
                           {order.customerName}
                           <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300">
                             #{order.id.slice(-6).toUpperCase()}
                           </span>
                        </h3>
                        <p className="text-sm font-medium text-slate-600 truncate">{order.customerEmail}</p>
                     </div>
                     <div>
                       {getStatusBadge(order.status)}
                     </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                     <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 block mb-1 uppercase">Despacho</span>
                        <p className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg">
                          📍 {order.shippingAddress || 'Retiro en Tienda / Digital'}
                        </p>
                     </div>

                     <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-4 space-y-2 max-h-32 overflow-y-auto">
                        <span className="text-xs font-bold text-blue-800 block uppercase">Ítemes Comprados</span>
                        {order.items.map((it: any) => (
                           <div key={it.id} className="flex justify-between items-center text-sm">
                              <span className="font-semibold text-slate-700 truncate mr-2">
                                {it.quantity}x {it.product?.name || 'Producto Removido'}
                              </span>
                              <span className="font-black text-slate-900 whitespace-nowrap">${(it.unitPrice * it.quantity).toLocaleString('es-CL')}</span>
                           </div>
                        ))}
                     </div>

                     <div className="mt-auto border-t border-slate-100 pt-4 flex justify-between items-end">
                       <div>
                         <span className="text-xs font-bold text-slate-500 block uppercase">Total Recaudado</span>
                         <span className="text-2xl font-black text-emerald-600">${order.totalAmount.toLocaleString('es-CL')}</span>
                       </div>
                       
                       {/* Control de Acciones basadas en el Estado */}
                       <div className="flex gap-2">
                          {order.status === 'PAID' && (
                            <button 
                              onClick={() => handleStatusChange(order.id, 'SENT')}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition flex gap-1 items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.893 28.893 0 0 0 3.105 2.288Z" /></svg>
                              Despachar
                            </button>
                          )}
                          {order.status === 'SENT' && (
                             <div className="flex flex-col items-end gap-1">
                                <div className="text-right">
                                   <span className="block text-[10px] font-bold text-slate-500 uppercase">Transporte: {order.courierName || 'N/A'}</span>
                                   <span className="block text-sm font-black text-blue-600">Doc: {order.trackingNumber || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button 
                                     onClick={() => {
                                        if(window.confirm('¿Deseas anular el despacho de este paquete y regresarlo al estado "Para Despachar"?\n\nEsto borrará el Courier y número de seguimiento asignado, permitiéndote enviar uno nuevo.')) {
                                            handleStatusChange(order.id, 'PAID')
                                        }
                                     }}
                                     className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-bold transition-colors"
                                  >
                                     ❌ Anular
                                  </button>
                                  <button 
                                     onClick={() => handleStatusChange(order.id, 'ARCHIVED')}
                                     className="text-[10px] text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                                  >
                                     📦 Archivar
                                  </button>
                                </div>
                             </div>
                          )}
                       </div>
                     </div>
                  </div>
               </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal Transporte de Despacho */}
      {shippingModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
               <h3 className="text-xl font-black text-slate-900 mb-2">🚚 Información de Despacho</h3>
               <p className="text-sm text-slate-600 font-medium mb-6">Para marcar este pedido como Despachado, por favor registra con qué empresa lo enviaste para tener un respaldo.</p>
               
               <label className="block text-sm font-bold text-slate-700 mb-2">Empresa Transportista (Courier)</label>
               <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  value={shippingModalData.courierName}
                  onChange={e => setShippingModalData({...shippingModalData, courierName: e.target.value})}
               >
                  <option value="">Selecciona Empresa...</option>
                  <option value="Starken">Starken</option>
                  <option value="Chilexpress">Chilexpress</option>
                  <option value="Bluexpress">Bluexpress</option>
                  <option value="Correos de Chile">Correos de Chile</option>
                  <option value="Mercado Envíos">Mercado Envíos</option>
                  <option value="Delivery Propio">Delivery Propio Personalizado</option>
               </select>

               <label className="block text-sm font-bold text-slate-700 mb-2">N° Comprobante / Tracking (Opcional)</label>
               <input 
                  type="text" 
                  placeholder="Ej: 994321283"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 mb-6 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  value={shippingModalData.trackingNumber}
                  onChange={e => setShippingModalData({...shippingModalData, trackingNumber: e.target.value})}
               />

               <div className="flex gap-3">
                 <button 
                    onClick={() => setShippingModalData(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                 >
                   Cancelar
                 </button>
                 <button 
                    onClick={() => handleStatusChange(shippingModalData.id, 'SENT')}
                    disabled={isSaving || !shippingModalData.courierName}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                 >
                   {isSaving ? 'Guardando...' : 'Confirmar Envío'}
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
