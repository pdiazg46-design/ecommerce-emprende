import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Traer todos los pedidos de la base de datos de este vendedor
    const orders = await prisma.ecommerceOrder.findMany({
      where: {
        storeId: dbUser.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ orders })

  } catch (error: any) {
    console.error('Error GET orders:', error)
    return NextResponse.json({ error: 'Error Interno Base de Datos: ' + (error.message || String(error)) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { orderId, status, courierName, trackingNumber } = await req.json()

    if (!orderId || !status) {
       return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    const existingOrder = await prisma.ecommerceOrder.findUnique({
        where: { id: orderId }
    })
    
    if(!existingOrder) {
         return NextResponse.json({ error: 'Pedido Inexistente.' }, { status: 404 })
    }

    // Autorización Bifurcada:
    // 1. Un usuario anónimo (comprador volviendo de MP) SÓLO puede reportar status = 'PAID' para sí mismo
    // 2. Un usuario autenticado (dueño tienda) puede modificar TODO (Despacho, tracking, status = 'SHIPPED', etc)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let dbUser;
    
    if (user && user.email) {
       // Viaje Autenticado: Es el dueño de la tienda administrando
       dbUser = await prisma.user.findUnique({ where: { email: user.email } })
       
       if (!dbUser || existingOrder.storeId !== dbUser.id) {
          return NextResponse.json({ error: 'Prohibido: Esta orden pertenece a otra tienda' }, { status: 403 })
       }
    } else {
       // Viaje Anónimo: Es el cliente regresando del Banco. Solo le permitimos marcar como PAID.
       if (status !== 'PAID' && status !== existingOrder.status) {
           return NextResponse.json({ error: 'Acción no autorizada para clientes públicos' }, { status: 401 })
       }
       // Para el Trípode Financiero necesitamos el usuario dueño de todos modos
       dbUser = await prisma.user.findUnique({ where: { id: existingOrder.storeId } })
       
       if (!dbUser) {
           return NextResponse.json({ error: 'Dueño de reserva ilocalizable' }, { status: 404 })
       }
    }

    // Si la orden pasa a PAID (ya sea desde acá o via webhook a futuro), 
    // y no estaba previamente PAID (para evitar duplicación), 
    // registramos la caja en Emprende (Trípode de Ventas)
    const isTransitioningToPaid = status === 'PAID' && existingOrder.status !== 'PAID'

    // Ejecutar Transacción Atómica SÓLO para la consistencia del E-Commerce (Orden & Stock)
    const updatedOrder = await prisma.$transaction(async (tx) => {
       // 1. Actualizar el estado del Pedido
       const order = await tx.ecommerceOrder.update({
         where: { id: orderId },
         data: {
           status,
           ...(courierName !== undefined && { courierName }),
           ...(trackingNumber !== undefined && { trackingNumber })
         },
         include: { items: { include: { product: true } } }
       })

       // 2. Si es transición a Pagado, descontar inventario del Sistema Central
       if (isTransitioningToPaid) {
          for (const item of order.items) {
             await tx.product.update({
               where: { id: item.productId },
               data: {
                 stockEcommerce: { decrement: item.quantity },
                 stock: { decrement: item.quantity }
               }
             })
          }
       }
       return order
    })

    // 3. (TRÍPODE) Registrar el flujo de dinero en Emprende (F29) de forma AISLADA
    //    Si esto falla por falta de campos de otras apps, no hará Rollback a la Venta asegurada.
    if (isTransitioningToPaid) {
        try {
           await prisma.transaction.create({
              data: {
                 userId: dbUser.id,
                 type: 'WEB_SALE',
                 paymentMethod: 'ONLINE',
                 taxDocumentType: 'BOLETA', // Asumido por defecto SaaS
                 amount: updatedOrder.totalAmount, // El monto real de la venta
                 quantity: 1, // 1 canasta
                 description: `Venta E-Commerce #${updatedOrder.id.slice(-6).toUpperCase()} (${updatedOrder.customerName})`,
                 date: new Date()
              }
           })
        } catch (tripodeError) {
           console.error("[CRÍTICO] Falló el Tripode a Emprende para la orden:", updatedOrder.id, tripodeError)
           // Aquí podríamos despachar mail interno a Soporte si existiese.
        }
    }

    return NextResponse.json({ success: true, order: updatedOrder })

  } catch (error) {
    console.error('Error PATCH order:', error)
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 })
  }
}
