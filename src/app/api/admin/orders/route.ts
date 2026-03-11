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

  } catch (error) {
    console.error('Error GET orders:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId, status, courierName, trackingNumber } = await req.json()

    if (!orderId || !status) {
       return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario principal no encontrado' }, { status: 404 })
    }

    // Verificar que el ID del pedido le pertenezca a la tienda del logueado
    const existingOrder = await prisma.ecommerceOrder.findUnique({
        where: { id: orderId }
    })
    
    if(!existingOrder || existingOrder.storeId !== dbUser.id) {
         return NextResponse.json({ error: 'Pedido Inexistente o Prohibido.' }, { status: 403 })
    }

    // Si la orden pasa a PAID (ya sea desde acá o via webhook a futuro), 
    // y no estaba previamente PAID (para evitar duplicación), 
    // registramos la caja en Emprende (Trípode de Ventas)
    const isTransitioningToPaid = status === 'PAID' && existingOrder.status !== 'PAID'

    // Ejecutar Transacción Atómica
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

       // 2. Si es transición a Pagado, Crear Ingreso(s) Financiero(s) en App Emprende
       if (isTransitioningToPaid) {
          // Podemos generar 1 transacción global en Emprende o 1 por ítem. 
          // Dada la estructura de `Transaction` que pide projectId/quantity, haremos 1 transacción global por el Total de la boleta.
          // Idealmente se desglosaría si `Transaction` lo soportara natively, pero Emprende-POS está diseñado para leer Type: VENTA.
          await tx.transaction.create({
             data: {
                userId: dbUser.id,
                type: 'WEB_SALE',
                paymentMethod: 'ONLINE',
                taxDocumentType: 'BOLETA', // Asumido por defecto SaaS
                amount: order.totalAmount, // El monto real de la venta
                quantity: 1, // 1 canasta
                description: `Venta E-Commerce #${order.id.slice(-6).toUpperCase()} (${order.customerName})`,
                date: new Date()
             }
          })
          
          // Además, siendo congruentes con el tripode, aquí descontamos el inventario 
          // (Puesto que se sacó del checkout y se pasó a la confirmación de pago)
          for (const item of order.items) {
             await tx.product.update({
               where: { id: item.productId },
               data: {
                 stockEcommerce: { decrement: item.quantity },
                 stock: { decrement: item.quantity } // Descuenta del stock físico también por seguridad de la feria
               }
             })
          }
       }
       return order
    })

    return NextResponse.json({ success: true, order: updatedOrder })

  } catch (error) {
    console.error('Error PATCH order:', error)
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 })
  }
}
