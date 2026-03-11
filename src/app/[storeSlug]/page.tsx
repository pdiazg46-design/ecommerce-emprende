import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CartBadge } from '@/components/cart/CartBadge'
import { CatalogAddToCart } from '@/components/cart/CatalogAddToCart'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  // Buscar el usuario al que le pertenece la tienda
  const settingsOwner = await prisma.ecommerceSettings.findUnique({
    where: { storeSlug: storeSlug },
    include: { user: true }
  })

  if (!settingsOwner || !settingsOwner.user) {
    notFound();
  }
  
  const owner = settingsOwner.user;
  const brand = settingsOwner || {
    storeName: "EMPRENDE",
    storeSlogan: "Tu visión, nuestra tecnología",
    logoUrl: null,
    primaryColor: "#4285F4"
  }

  const products = await prisma.product.findMany({
    where: {
      isActiveOnline: true,
      stock: {
        gt: 0
      },
      imageUrl: {
        not: null
      },
      user: {
        id: owner.id
      }
    },
    take: 12,
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center relative">
          
          {/* Sección Izquierda (Logo y Nombre) */}
          <div className="flex items-center gap-4">
             {brand.logoUrl && (
               <img src={brand.logoUrl} alt={brand.storeName} className="h-12 sm:h-14 w-auto object-contain drop-shadow-sm shrink-0" />
             )}
             
             <div className="text-left flex flex-col justify-center">
               <h1 
                 className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase leading-none" 
                 style={{ color: brand.primaryColor || '#4285F4', textShadow: '1px 1px 2px rgba(0,0,0,0.05)' }}
               >
                 {brand.storeName}
               </h1>
               {brand.storeSlogan && (
                 <p className="text-[#5f7d9c] text-xs sm:text-sm mt-1 font-medium tracking-wide leading-none">
                   {brand.storeSlogan}
                 </p>
               )}
             </div>
          </div>

          {/* Sección Derecha (Carrito) */}
          <nav className="flex items-center justify-end shrink-0 ml-4">
            <Link href={`/${storeSlug}/cart`} className="relative p-2 text-slate-600 hover:text-blue-600 transition block bg-slate-50 hover:bg-slate-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <CartBadge />
            </Link>
          </nav>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-8">
           <div>
             <h2 className="text-3xl font-bold text-slate-900">Catálogo Abierto</h2>
             <p className="text-slate-500 mt-2 text-sm">Los mejores productos, en tu puerta.</p>
           </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900">No hay productos disponibles</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">Actualmente no tenemos productos publicados con stock en la web. Vuelve más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
              >
                <Link href={`/${storeSlug}/productos/${product.slug || product.id}`} className="aspect-square bg-slate-100 relative overflow-hidden block">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}
                   <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm text-xs font-bold text-slate-700">
                     {product.stock} disp.
                  </div>
                  {/* Overlay interactivo para "Ver Detalles" */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-[110%] group-hover:translate-y-0 transition-transform duration-300 flex justify-center">
                    <span className="text-white text-sm font-semibold tracking-wide">Visitar detalles e imágenes</span>
                  </div>
                </Link>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm h-10">{product.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black text-blue-600">
                      ${product.price.toLocaleString('es-CL')}
                    </span>
                    <CatalogAddToCart product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      stock: product.stock
                    }} storeSlug={storeSlug} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer del Proveedor SaaS (AT-SIT) */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-sm mb-4 font-medium">Tecnología e-commerce impulsada por</p>
          <img 
            src="/logo_atsit.png" 
            alt="AT-SIT Integración Tecnológica" 
            className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity mb-4" 
          />
          <a 
            href="mailto:atsittelecom@gmail.com" 
            className="text-blue-500 hover:text-blue-600 font-semibold text-sm flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            atsittelecom@gmail.com
          </a>
        </div>
      </footer>
    </main>
  )
}
