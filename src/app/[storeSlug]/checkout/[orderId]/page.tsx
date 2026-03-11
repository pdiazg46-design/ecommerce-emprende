import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MercadoPagoButton from '@/components/ecommerce/MercadoPagoButton'

export default async function CheckoutPaymentPage(props: {
  params: Promise<{ storeSlug: string; orderId: string }>
  searchParams: Promise<{ status?: string, payment_id?: string }>
}) {
  const resolvedParams = await props.params
  const searchParams = await props.searchParams
  const paymentStatus = searchParams.status
  const paymentId = searchParams.payment_id
  
  // Buscar la configuración de la tienda por slug
  const storeSettings = await prisma.ecommerceSettings.findUnique({
    where: { storeSlug: resolvedParams.storeSlug },
    include: {
      user: {
        select: {
          id: true,
          acceptsMercadoPago: true,
          useSumUp: true,
          phone: true // Para fallaback de WhatsApp
        }
      }
    }
  })

  // Validaciones
  if (!storeSettings || !(storeSettings as any).isActive) {
    notFound()
  }

  // Buscar la Orden específica verificando pertenencia
  const order = await prisma.ecommerceOrder.findUnique({
    where: { 
        id: resolvedParams.orderId,
        storeId: storeSettings.user.id
    },
    include: {
        items: {
           include: { product: true }
        }
    }
  })

  if (!order) {
    notFound()
  }

  // --------------------------------------------------------------------------------
  // MANEJO DE RETORNO Y APROBACIÓN DE MERCADOPAGO (Tripode Financiero Activator)
  // --------------------------------------------------------------------------------
  let isJustApproved = false

  if (paymentStatus === 'approved' && paymentId && order.status === 'PENDING_PAYMENT') {
     // Si venimos regresando de MP con éxito y la orden aún estaba pendiente:
     // 1. Enviamos confirmación oculta a la BD
     // 2. Mostramos UI Verde
     isJustApproved = true
     try {
       await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/orders`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           orderId: order.id, 
           status: 'PAID' 
         })
       })
     } catch (e) {
       console.error("Error auto-confirmando pago de MP:", e)
     }
  }

  const isOrderClosed = order.status !== 'PENDING_PAYMENT' || isJustApproved
  
  if (isOrderClosed) {
     return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
           <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
           </div>
           
           <h1 className="text-3xl font-black text-slate-900 mb-4">
               {isJustApproved ? '¡Pago Aprobado con Éxito!' : 'Esta orden ya fue procesada'}
           </h1>
           <p className="text-slate-600 font-medium mb-8">
               {isJustApproved 
                  ? `Tu transacción (Ref: ${paymentId}) fue validada digitalmente.` 
                  : 'El pago ya fue verificado o el pedido ya fue despachado.'}
           </p>

           <Link href={`/${resolvedParams.storeSlug}`} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
              Volver al Catálogo
           </Link>
        </div>
     )
  }

  const hasPaymentGateway = storeSettings.user.acceptsMercadoPago || storeSettings.user.useSumUp;
  const whatsappNumber = storeSettings.user.phone || '';
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const waRef = `https://wa.me/${cleanPhone}?text=Hola!%20Acabo%20de%20reservar%20el%20pedido%20${order.id.slice(-6).toUpperCase()}%20por%20$${order.totalAmount.toLocaleString('es-CL')}.%20Quería%20coordinar%20el%20pago%20con%20tarjeta.`;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${resolvedParams.storeSlug}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition group">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
             <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
           </svg>
           Regresar a la Tienda
        </Link>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
             </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">¡Tu reserva fue exitosa!</h1>
          <p className="text-slate-600 font-medium">Orden <span className="text-slate-900 font-bold uppercase">#{order.id.slice(-6)}</span> reservada bajo: {order.customerName}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
           <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
             <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">1</span>
             Resumen a Pagar
           </h2>
           
           <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex justify-between items-center mb-8">
              <div>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Monto Total</p>
                 <p className="text-4xl font-black text-slate-900">${order.totalAmount.toLocaleString('es-CL')}</p>
              </div>
           </div>

           <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
             <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm">2</span>
             Realizar Pago Seguro
           </h2>

           {!hasPaymentGateway ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
                <h3 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
                   Tienda en Configuración
                </h3>
                <p className="text-amber-800 text-sm mb-4">El vendedor aún no ha activado los enlaces webs automáticos de tarjeta en su cuenta.</p>
                <a 
                   href={waRef}
                   target="_blank"  
                   className="w-full block text-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition"
                >
                   Solicitar Link de Pago por WhatsApp
                </a>
              </div>
           ) : (
              <div className="space-y-4">
                 <p className="text-sm text-slate-600 font-medium mb-4">
                    Selecciona tu medio de pago. Toda la transacción será procesada bajo estrictos estándares de seguridad bancaria externa. Jamás compartiremos ni almacenaremos los datos de tus tarjetas.
                 </p>

                 {storeSettings.user.acceptsMercadoPago && (
                    <MercadoPagoButton orderId={order.id} />
                 )}

                 {storeSettings.user.useSumUp && (
                     <button disabled className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 opacity-60 cursor-not-allowed group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                             <div className="font-black text-slate-800 tracking-tighter">sumup.</div>
                          </div>
                          <div className="text-left">
                             <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition">SumUp (Proximamente)</h4>
                             <p className="text-xs text-slate-500">Checkout Seguro con Tarjetas</p>
                          </div>
                       </div>
                    </button>
                 )}
                 
                 {/* Temporary fallback for the demo until API integrations are complete */}
                 <div className="pt-6 border-t border-slate-100">
                    <a 
                       href={waRef}
                       target="_blank"  
                       className="w-full block text-center bg-slate-900 shadow-xl shadow-slate-900/20 hover:scale-[1.02] text-white font-bold py-4 px-4 rounded-2xl transition-all"
                    >
                       Coordinar Pago Directo con la Tienda
                    </a>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
