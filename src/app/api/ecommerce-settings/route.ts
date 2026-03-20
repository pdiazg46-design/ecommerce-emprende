// @ts-nocheck
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

    const settings = await prisma.ecommerceSettings.findUnique({
        where: { userId: dbUser.id }
    })

    return NextResponse.json(
      settings || {
        storeName: "EMPRENDE",
        storeSlogan: "Tu visión, nuestra tecnología",
        storeSlug: null,
        logoUrl: null,
        primaryColor: "#4285F4",
        shippingCoverage: []
      }
    )
  } catch (error) {
    console.error('Error GET ecommerce settings:', error)
    return NextResponse.json({ error: 'Error al obtener la configuración' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { storeName, storeSlogan, storeSlug, logoUrl, primaryColor, shippingCoverage } = await req.json()

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario principal no encontrado' }, { status: 404 })
    }

    // Upsert (Crear o Actualizar)
    const settings = await prisma.ecommerceSettings.upsert({
      where: { userId: dbUser.id },
      update: {
        storeName,
        storeSlogan,
        storeSlug,
        logoUrl,
        primaryColor,
        shippingCoverage
      },
      create: {
        userId: dbUser.id,
        storeName: storeName || "EMPRENDE",
        storeSlogan: storeSlogan || "Tu visión, nuestra tecnología",
        storeSlug,
        logoUrl,
        primaryColor: primaryColor || "#4285F4",
        shippingCoverage: shippingCoverage || []
      }
    })

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Error POST ecommerce settings:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
