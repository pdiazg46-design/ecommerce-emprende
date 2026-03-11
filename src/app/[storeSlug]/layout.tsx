import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CartBadge } from '@/components/cart/CartBadge'

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params;
  const decodedStoreSlug = decodeURIComponent(storeSlug);
  
  const formattedStoreSlug = decodedStoreSlug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  const settingsOwner = await prisma.ecommerceSettings.findUnique({
    where: { storeSlug: formattedStoreSlug },
    include: { user: true }
  })

  if (!settingsOwner || !settingsOwner.user) {
    notFound();
  }
  
  // Casting 'any' para evitar colisión de tipado estricto Prisma JSON -> String Array
  const brandData: any = settingsOwner || {}

  const brand = {
    storeName: brandData.storeName || "EMPRENDE",
    storeSlogan: brandData.storeSlogan || "Tu visión, nuestra tecnología",
    logoUrl: brandData.logoUrl || null,
    primaryColor: brandData.primaryColor || "#4285F4",
    shippingCoverage: (brandData.shippingCoverage as string[]) || []
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm relative shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center relative">
          
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
               {brand.shippingCoverage && brand.shippingCoverage.length > 0 && (
                 <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded w-fit border border-emerald-200 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    <span>Despachos a: {brand.shippingCoverage.join(' | ')}</span>
                 </div>
               )}
             </div>
          </div>

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
      
      <div className="flex-1 w-full mx-auto">
        {children}
      </div>
    </div>
  )
}
