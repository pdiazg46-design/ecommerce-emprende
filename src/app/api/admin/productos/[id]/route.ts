import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Seguridad Tenant: Solo se pueden editar productos del dueño de la página
    const product = await prisma.product.findUnique({
      where: { id },
      select: { user: { select: { email: true } } }
    });

    if (!product || product.user?.email !== 'pdiazg46@gmail.com') {
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
