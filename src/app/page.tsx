import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CartBadge } from '@/components/cart/CartBadge'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const products = await prisma.product.findMany({
    where: {
      isActiveOnline: true,
      stockEcommerce: {
        gt: 0
      }
    },
    take: 12,
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <main className="min-h-screen bg-slate-50">


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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            {products.map((product) => (
              <Link 
                href={`/productos/${product.slug || product.id}`} 
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
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
                     {product.stockEcommerce} disp.
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm h-10">{product.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black text-blue-600">
                      ${product.price.toLocaleString('es-CL')}
                    </span>
                    <button className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-colors active:scale-95">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
