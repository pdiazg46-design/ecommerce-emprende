import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductClientView } from './ProductClientView'
import { CartBadge } from '@/components/cart/CartBadge'

interface PageProps {
  params: Promise<{ storeSlug: string, slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  // En Next.js 15, los params de página dinámica son una Promesa.
  const resolvedParams = await params
  
  const formattedStoreSlug = decodeURIComponent(resolvedParams.storeSlug)
    .trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    
  const formattedProductSlug = decodeURIComponent(resolvedParams.slug)
    .trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

  // Primero verificamos que la tienda existe (Igual que el Index Principal)
  const settingsOwner = await prisma.ecommerceSettings.findUnique({
    where: { storeSlug: formattedStoreSlug },
    select: { userId: true, storeName: true, logoUrl: true, storeSlogan: true }
  })

  if (!settingsOwner) {
    notFound()
  }

  // Luego de validar, traemos el producto físico asegurando la protección del dueño original
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: formattedProductSlug },
        { id: formattedProductSlug }
      ],
      user: {
        id: settingsOwner.userId
      },
      isActiveOnline: true
    }
  })

  if (!product) {
    notFound()
  }

  // Serializar los datos para el Client Component (eliminando Date objects)
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    stockEcommerce: product.stockEcommerce,
    stock: product.stock,
    imageUrl: product.imageUrl,
    descriptionLong: product.descriptionLong,
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabecera Estándar SaaS Inyectada para visibilidad de Carrito */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <Link href={`/${resolvedParams.storeSlug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {settingsOwner.logoUrl ? (
              <img src={settingsOwner.logoUrl} alt={settingsOwner.storeName} className="h-10 w-10 object-contain rounded-full border border-slate-100" />
            ) : (
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-lg shadow-inner">🏪</div>
            )}
            <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">{settingsOwner.storeName}</h1>
          </Link>
          
          <nav className="flex items-center justify-end">
            <Link href={`/${resolvedParams.storeSlug}/cart`} className="relative p-2 text-slate-600 hover:text-blue-600 transition block bg-slate-50 hover:bg-slate-100 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <CartBadge />
            </Link>
          </nav>
        </div>
      </header>
      
      <div className="py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Columna Izquierda: Imagen */}
          <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
             {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
             ) : (
                <div className="text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mx-auto">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
             )}
          </div>
          
          {/* Columna Derecha: Información Interactiva */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
             <ProductClientView product={productData} storeSlug={resolvedParams.storeSlug} />
          </div>
        </div>
      </div>
      </div>

      {/* Footer del Proveedor SaaS (AT-SIT) */}
      <footer className="mt-16 bg-transparent border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-sm mb-4 font-medium">Tecnología e-commerce impulsada por</p>
          <img 
            src="/logo_atsit.png" 
            alt="AT-SIT Integración Tecnológica" 
            className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity mb-4" 
          />
          <a 
            href="mailto:atsittelecom@gmail.com" 
            className="text-blue-500 hover:text-blue-600 font-semibold text-sm flex items-center gap-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-4 py-2 rounded-full transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            atsittelecom@gmail.com
          </a>
        </div>
      </footer>
    </div>
  )
}
