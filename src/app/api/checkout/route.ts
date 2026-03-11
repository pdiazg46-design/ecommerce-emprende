import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customer, items, totalAmount } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 })
    }

    // El StoreId actualmente en la demo será el primer Admin Owner del proyecto EMPRENDE
    // ya que este E-Commerce es una tienda única. En multi-tenant lo pasaríamos en el payload.
    const storeOwner = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    })
    
    if(!storeOwner) {
         return NextResponse.json({ error: 'Tienda inactiva.' }, { status: 500 })
    }

    // Iniciar Transacción Atómica para prevenir ventas fantasmas concurrentes
    const orderData = await prisma.$transaction(async (tx) => {
      // 1. Verificar stock actual de cada item y bloquear
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
          select: { stockEcommerce: true, name: true }
        })

        if (!product || product.stockEcommerce < item.quantity) {
          throw new Error(`Inventario insuficiente para: ${product?.name ?? 'Producto Desconocido'}. Solo quedan ${product?.stockEcommerce || 0}`)
        }
      }

      // 2. Crear la Orden (EcommerceOrder)
      const newOrder = await tx.ecommerceOrder.create({
        data: {
          storeId: storeOwner.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          shippingAddress: customer.address,
          totalAmount: totalAmount,
          status: 'PENDING', // PENDIENTE DE PAGO FICTICIO
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              unitPrice: item.price
            }))
          }
        }
      })

      // 3. Descontar el Stock ONLINE (El Realtime de Emprende escuchará esto)
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stockEcommerce: {
              decrement: item.quantity
            }
          }
        })
      }

      return newOrder
    })

    return NextResponse.json({ success: true, orderId: orderData.id }, { status: 200 })

  } catch (error: any) {
    console.error('Checkout Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar pedido' },
      { status: 500 }
    )
  }
}
