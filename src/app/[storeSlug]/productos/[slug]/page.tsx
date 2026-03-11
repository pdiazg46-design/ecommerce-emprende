import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProductClientView } from './ProductClientView'

interface PageProps {
  params: Promise<{ storeSlug: string, slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  // En Next.js 15, los params de página dinámica son una Promesa.
  const resolvedParams = await params

  // Buscar el producto por slug (primero) o directamente por su ID físico
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: resolvedParams.slug },
        { id: resolvedParams.slug }
      ],
      user: {
        ecommerceSettings: {
          storeSlug: resolvedParams.storeSlug
        }
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
    imageUrl: product.imageUrl,
    descriptionLong: product.descriptionLong,
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
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
