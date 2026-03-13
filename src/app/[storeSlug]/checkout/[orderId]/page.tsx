import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MercadoPagoButton from '@/components/ecommerce/MercadoPagoButton'
import AutoConfirmPayment from '@/components/ecommerce/AutoConfirmPayment'

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
  
  const isJustApproved = paymentStatus === 'approved' && paymentId && order.status === 'PENDING_PAYMENT'
  const isOrderClosed = order.status !== 'PENDING_PAYMENT' || isJustApproved
  
  if (isOrderClosed) {
     return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-slate-50">
           
           <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 max-w-xl w-full text-center relative overflow-hidden">
               {/* Decorative Background */}
               <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
               
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 -rotate-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
               </div>
               
               <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                   {isJustApproved ? '¡Pago Aprobado!' : 'Orden Verificada'}
               </h1>
               
               <p className="text-slate-500 font-medium mb-8 text-sm sm:text-base">
                   {isJustApproved 
                      ? `Tu transacción (Ref: ${paymentId}) fue validada digitalmente con éxito.` 
                      : 'Este pedido ya se encuentra procesado y pagado en el sistema.'}
               </p>

               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 text-left">
                  <div className="w-full sm:w-auto text-center sm:text-left">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Pagado</p>
                     <p className="text-3xl font-black text-slate-900">${order.totalAmount.toLocaleString('es-CL')}</p>
                  </div>
                  <div className="w-full sm:w-auto h-px sm:h-12 w-12 sm:w-px bg-slate-200 hidden sm:block"></div>
                  <div className="w-full sm:w-auto text-center sm:text-left">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Código Pedido</p>
                     <p className="text-xl font-bold text-slate-700 tracking-wider">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
               </div>

               <Link href={`/${resolvedParams.storeSlug}`} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-800 transition active:scale-[0.98]">
                  ← Volver a la Tienda
               </Link>

               {/* AutoConfirm Invisible */}
               {isJustApproved && (
                 <AutoConfirmPayment orderId={order.id} />
               )}
           </div>
        </div>
     )
  }

  const hasPaymentGateway = storeSettings.user.acceptsMercadoPago || storeSettings.user.useSumUp;
  const whatsappNumber = storeSettings.user.phone || '';
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const waRef = `https://wa.me/${cleanPhone}?text=Hola!%20Acabo%20de%20reservar%20el%20pedido%20${order.id.slice(-6).toUpperCase()}%20por%20$${order.totalAmount.toLocaleString('es-CL')}.%20Quería%20coordinar%20el%20pago%20con%20tarjeta.`;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${resolvedParams.storeSlug}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium mb-4 transition group">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
             <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
           </svg>
           Regresar a la Tienda
        </Link>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
             </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">¡Tu reserva fue exitosa!</h1>
          <p className="text-sm text-slate-600 font-medium">Orden <span className="text-slate-900 font-bold uppercase">#{order.id.slice(-6)}</span> reservada bajo: {order.customerName}</p>
        </div>

        <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 shadow-sm border border-slate-200 mb-4">
           <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
             Resumen a Pagar
           </h2>
           
           <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center mb-6">
              <div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Monto Total</p>
                 <p className="text-3xl font-black text-slate-900">${order.totalAmount.toLocaleString('es-CL')}</p>
              </div>
           </div>

           <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
             <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
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
                  <p className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">
                     Selecciona tu medio de pago. Transacción procesada bajo estándares de seguridad externa. No almacenaremos datos de tus tarjetas.
                  </p>

                  {storeSettings.user.acceptsMercadoPago && (
                     <MercadoPagoButton orderId={order.id} />
                  )}

                  {storeSettings.user.useSumUp && (
                      <button disabled className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-slate-200 opacity-60 cursor-not-allowed group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                              <div className="text-xs font-black text-slate-800 tracking-tighter">sumup.</div>
                           </div>
                           <div className="text-left">
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">SumUp (Proximamente)</h4>
                              <p className="text-[10px] text-slate-500">Checkout Seguro con Tarjetas</p>
                           </div>
                        </div>
                     </button>
                  )}
                  
                  {/* Botón de Pruebas / Transferencia Manual By-Pass */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-400 mb-3 text-center uppercase tracking-wider">Otras Opciones</p>
                      
                      <button
                         onClick={async () => {
                             // Simulamos que el banco aprobó la transferencia y nos devolvió a la url de éxito
                             window.location.href = `/${resolvedParams.storeSlug}/checkout/${order.id}?status=approved&payment_id=test_transfer_123`
                         }}
                         className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition shadow-sm border border-slate-300 active:scale-[0.98]"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                         Aviso de Transferencia Manual (Probar Venta)
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-2 px-4">
                        Este botón permite completar el ciclo de compra sin tarjeta de crédito. Usar para confirmar el rebaje de stock automático en el módulo de ventas.
                      </p>
                  </div>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
