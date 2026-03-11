/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // 1. Verificación de Seguridad Básica
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
             // Readonly in GET requests
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    // Como el middleware está apagado, asegurémonos aquí
    if (!user && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Consulta Segura (Aislada de React Edge)
    const products = await prisma.product.findMany({
      where: {
        isActiveOnline: true,
        user: {
          // Asumimos el usuario específico como antes
          email: 'pdiazg46@gmail.com'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('API /admin/catalogo GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Verificar sesión de Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Capturar Payload
    const { productId, descriptionLong } = await request.json()
    
    if (!productId) {
      return NextResponse.json({ error: 'Falta el ID del producto' }, { status: 400 })
    }

    // 3. Persistencia en DB
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { descriptionLong }
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error: any) {
    console.error('API /admin/catalogo PATCH Error:', error)
    return NextResponse.json({ error: 'Fallo al guardar la reseña' }, { status: 500 })
  }
}
