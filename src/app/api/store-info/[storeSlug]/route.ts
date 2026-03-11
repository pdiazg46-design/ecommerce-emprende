import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    
    // Normalization identical to public store resolution
    const formattedStoreSlug = decodeURIComponent(storeSlug)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const store = await prisma.ecommerceSettings.findUnique({
      where: { storeSlug: formattedStoreSlug },
      select: {
        storeName: true,
        storeSlogan: true,
        logoUrl: true,
        primaryColor: true,
        shippingCoverage: true,
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    return NextResponse.json(store);

  } catch (error) {
    console.error('Error in public store API:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
