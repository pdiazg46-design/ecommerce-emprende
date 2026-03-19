import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Se requiere la URL de la imagen' }, { status: 400 })
    }

    // 0. Autenticacion Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || (process.env.NODE_ENV !== 'production' ? 'pdiazg46@gmail.com' : null);

    if (!userEmail) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Seguridad Tenant: Solo se pueden editar productos del dueño de la página
    const product = await prisma.product.findUnique({
      where: { id },
      select: { user: { select: { email: true } } }
    });

    if (!product || product.user?.email !== userEmail) {
      return NextResponse.json({ error: 'No autorizado / Producto no encontrado o no te pertenece' }, { status: 403 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { imageUrl }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product image:', error)
    return NextResponse.json({ error: 'Error del servidor al actualizar el producto' }, { status: 500 })
  }
}
