import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })
    }

    // 1. Obtener la Orden y sus Items
    const order = await prisma.ecommerceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        store: {
            select: {
                id: true,
                mpAccessToken: true
            }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (!order.store.mpAccessToken) {
        return NextResponse.json({ error: 'La tienda no tiene credenciales de MercadoPago activas.' }, { status: 400 })
    }

    const isTestToken = order.store.mpAccessToken.startsWith('TEST-')

    // 2. Construir los items para MercadoPago
    const items = order.items.map(item => ({
      title: item.product.name,
      description: item.product.descriptionLong?.substring(0, 250) || 'Producto E-commerce',
      quantity: item.quantity,
      currency_id: 'CLP',
      unit_price: item.unitPrice
    }))

    // Construir la URL Base dinámica asegurando el protocolo
    // Vercel inyecta x-forwarded-host o podemos usar la variable
    const requestedHost = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const protocol = requestedHost?.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${requestedHost}`
    // Realizamos una consulta adicional para evitar problemas de Typings cruzados con Prisma JS Client Vercel/Local
    const settings = await prisma.ecommerceSettings.findUnique({
        where: { userId: order.store.id }
    })
    
    const storeSlug = settings?.storeSlug || 'tienda'

    // 3. Crear Preferencia en MP via API Nativa (Fetch)
    const preferenceData = {
      items,
      payer: {
        name: order.customerName,
        email: order.customerEmail,
      },
      back_urls: {
        success: `${baseUrl}/${storeSlug}/checkout/${order.id}?status=success`,
        failure: `${baseUrl}/${storeSlug}/checkout/${order.id}?status=failure`,
        pending: `${baseUrl}/${storeSlug}/checkout/${order.id}?status=pending`,
      },
      auto_return: 'approved',
      external_reference: order.id,
      statement_descriptor: (settings?.storeName || storeSlug).substring(0, 16).toUpperCase(), // Restricción de 16 caracteres de MP
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${order.store.mpAccessToken}`
      },
      body: JSON.stringify(preferenceData)
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
        console.error('MercadoPago API Error:', mpData)
        return NextResponse.json({ 
          error: `Error de MercadoPago: ${mpData.message || mpData.error || 'Rechazo de formato'}` 
        }, { status: 502 })
    }

    // Retornamos el link adecuado. Si es TEST, devolvemos el sandbox, de lo contrario el init_point
    const redirectUrl = isTestToken ? mpData.sandbox_init_point : mpData.init_point

    return NextResponse.json({ url: redirectUrl }, { status: 200 })

  } catch (error: any) {
    console.error('MP Preference Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
