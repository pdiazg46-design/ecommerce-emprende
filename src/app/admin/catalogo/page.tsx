/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { BrandConfig } from '@/components/admin/BrandConfig'

export default function AdminCatalogo() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'READY' | 'ATTENTION'>('ALL')
  const [showBrandModal, setShowBrandModal] = useState(false)

  // Estado para controlar qué producto está siendo editado
  const [editingDescId, setEditingDescId] = useState<string | null>(null)
  const [descDraft, setDescDraft] = useState<string>('')
  const [isSavingDesc, setIsSavingDesc] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/admin/catalogo')
        if (!res.ok) {
           const errData = await res.json()
           throw new Error(errData.error || `Error ${res.status}`)
        }
        const data = await res.json()
        setProducts(data.products || [])
      } catch (err) {
        const error = err as Error;
        setError(error.message || String(error))
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleSaveDescription = async (productId: string) => {
    setIsSavingDesc(true)
    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, descriptionLong: descDraft })
      })

      if (!res.ok) throw new Error('Fallo al guardar reseña')
      
      // Actualizar UI localmente
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, descriptionLong: descDraft } : p
      ))
      setEditingDescId(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSavingDesc(false)
    }
  }

  const filteredProducts = products.filter(p => {
    if (filterType === 'ALL') return true
    if (filterType === 'READY') return p.imageUrl !== null
    if (filterType === 'ATTENTION') return p.imageUrl === null
    return true
  })

  const stats = { 
    total: products.length, 
    withImage: products.filter(p => p.imageUrl !== null).length, 
    withoutImage: products.filter(p => p.imageUrl === null).length 
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Logo Oficial AT-SIT (Imagen) */}
              <div className="flex items-center justify-center">
                 <img src="/logo_atsit.png" alt="AT-SIT Integración Tecnológica" className="h-[46px] w-auto object-contain" />
              </div>
              
              {/* Logo Textual Emprende */}
              <div className="flex flex-col border-l border-slate-300 dark:border-slate-700 pl-6 cursor-pointer" onClick={() => window.location.href = '/'}>
                 <span className="text-2xl font-black tracking-widest text-[#4A87FF] leading-none my-1">
                   EMPRENDE
                 </span>
                 <span className="text-[11px] font-medium tracking-wide text-slate-400">
                   Tu visión, nuestra tecnología
                 </span>
              </div>
            </div>
            
            {/* Botón de Configuración Modal y Etiqueta */}
            <div className="text-right flex items-center gap-4">
              <span className="hidden sm:inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold tracking-wide uppercase">
                Panel E-Commerce
              </span>
              <button 
                onClick={() => setShowBrandModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.781.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Configurar Mi Tienda
              </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        
        {/* Modal de Configuración de Marca (SaaS) */}
        {showBrandModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop oscuro */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowBrandModal(false)}
            ></div>
            
            {/* Contenedor del Modal */}
            <div className="relative w-full max-w-2xl transform transition-all">
              <button 
                onClick={() => setShowBrandModal(false)}
                className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 focus:outline-none transition-colors"
                title="Cerrar Panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Le quitamos el mb-8 original para que quede ajustado en el modal */}
              <div className="max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl">
                <BrandConfig />
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button 
             onClick={() => setFilterType('ALL')}
             className={`text-left bg-white p-6 rounded-2xl border shadow-sm transition-all outline-none ${filterType === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02]' : 'border-slate-200 hover:border-blue-300'}`}
          >
             <div className="text-slate-500 text-sm font-semibold mb-1">Métricas Importables</div>
             <div className="text-3xl font-black text-slate-800">{stats.total}</div>
          </button>
          <button 
             onClick={() => setFilterType('READY')}
             className={`text-left bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-emerald-500 transition-all outline-none ${filterType === 'READY' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md transform scale-[1.02]' : 'border-slate-200 hover:border-emerald-300'}`}
          >
             <div className="text-emerald-600 text-sm font-semibold mb-1">Listos para Vender</div>
             <div className="text-3xl font-black text-emerald-600">{stats.withImage}</div>
          </button>
          <button 
             onClick={() => setFilterType('ATTENTION')}
             className={`text-left bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-amber-500 transition-all outline-none ${filterType === 'ATTENTION' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md transform scale-[1.02]' : 'border-slate-200 hover:border-amber-300'}`}
          >
             <div className="text-amber-600 text-sm font-semibold mb-1">Requieren Atención</div>
             <div className="text-3xl font-black text-amber-600">{stats.withoutImage}</div>
          </button>
        </div>

        {/* Product Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
           <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             Catálogo Sincronizado
             <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs">Live API</span>
           </h2>

           {isLoading ? (
              <div className="text-center py-12">
                 <div className="animate-spin inline-block w-8 h-8 flex-shrink-0 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                 <h3 className="text-slate-600 font-medium font-mono text-sm">
                  Consultando base de datos segura...
                 </h3>
              </div>
           ) : error ? (
              <div className="bg-red-50 p-4 border border-red-200 rounded-xl mb-6 text-red-700 font-mono text-sm overflow-auto">
                 <strong>Fallo en la API de Datos:</strong><br />
                 {error}
              </div>
           ) : products.length === 0 ? (
              <div className="text-center py-12">
                 <div className="text-4xl mb-3">👻</div>
                 <h3 className="text-slate-600 font-medium">No hay productos sincronizados</h3>
                 <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Agrega stock e-commerce en el POS Emprende.</p>
              </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
                     
                     <div className="w-full">
                       <ImageUploader 
                          productId={product.id} 
                          currentImage={product.imageUrl} 
                          onUploadSuccess={() => window.location.reload()} 
                        />
                     </div>

                     <div>
                       <h3 className="font-semibold text-slate-800 text-sm line-clamp-2" title={product.name}>
                         {product.name}
                       </h3>
                       <div className="flex justify-between items-center mt-2">
                         <span className="text-blue-600 font-black text-sm">${product.price?.toLocaleString('es-CL')}</span>
                         <span className="text-slate-600 text-[11px] px-2 py-1 bg-slate-100/80 rounded-md whitespace-nowrap border border-slate-200/60" title={`${product.stock} en Emprende`}>
                           Disponible: <strong className="text-slate-900 font-bold text-sm ml-0.5">{product.stock}</strong>
                         </span>
                       </div>

                       {/* Editor de Reseña (Descripción) */}
                       <div className="mt-3 pt-3 border-t border-slate-200/60">
                         {editingDescId === product.id ? (
                           <div className="flex flex-col gap-2 relative">
                             <textarea 
                               className="w-full text-sm border-slate-300 rounded-lg p-3 text-slate-700 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none pb-10"
                               placeholder="Escribe los detalles, medidas y características principales de este producto..."
                               value={descDraft}
                               onChange={(e) => setDescDraft(e.target.value)}
                               disabled={isSavingDesc}
                             />
                             <div className="absolute bottom-2 right-2 flex gap-1">
                               <button 
                                 type="button" 
                                 onClick={() => setEditingDescId(null)}
                                 className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-medium disabled:opacity-50"
                                 disabled={isSavingDesc}
                               >
                                 Cancelar
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => handleSaveDescription(product.id)}
                                 className="px-2 py-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm disabled:opacity-50 flex items-center gap-1"
                                 disabled={isSavingDesc}
                               >
                                 {isSavingDesc ? 'Guardando...' : 'Guardar'}
                               </button>
                             </div>
                           </div>
                         ) : (
                           <div 
                             className="group flex flex-col cursor-pointer hover:bg-slate-100/50 p-2 -mx-2 rounded-lg transition-colors duration-200"
                             onClick={() => {
                               setDescDraft(product.descriptionLong || '')
                               setEditingDescId(product.id)
                             }}
                           >
                             <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reseña del Producto</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                             </div>
                             {product.descriptionLong ? (
                               <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                 {product.descriptionLong}
                               </p>
                             ) : (
                               <p className="text-xs text-slate-400 italic">No has escrito una reseña aún. Haz clic para añadirla.</p>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </main>
    </div>
  )
}
