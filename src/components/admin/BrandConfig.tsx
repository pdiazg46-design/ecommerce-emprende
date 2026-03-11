'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { REGIONES_CHILE } from '@/lib/chile-data'

export function BrandConfig() {
  const [storeName, setStoreName] = useState('EMPRENDE')
  const [storeSlogan, setStoreSlogan] = useState('Tu visión, nuestra tecnología')
  const [storeSlug, setStoreSlug] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [shippingCoverage, setShippingCoverage] = useState<string[]>([])
  
  // Selectores secundarios de UI para armar zonas
  const [selectedRegionUi, setSelectedRegionUi] = useState('')
  const [selectedComunaUi, setSelectedComunaUi] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/ecommerce-settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStoreName(data.storeName || 'EMPRENDE')
          setStoreSlogan(data.storeSlogan || 'Tu visión, nuestra tecnología')
          setStoreSlug(data.storeSlug || '')
          setLogoUrl(data.logoUrl || '')
          setShippingCoverage(data.shippingCoverage || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Limpiar el slug: quitar acentos, pasar a minúsculas, espacios a guiones
      const cleanSlug = storeSlug
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remueve marcas diacríticas (tildes)
        .replace(/\s+/g, '-') // Reemplaza espacios por guiones
        .replace(/[^a-z0-9-]/g, '') // Todo lo demás que no sea letra o número
        .replace(/-+/g, '-') // Elimina guiones dobles
      
      const res = await fetch('/api/ecommerce-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, storeSlogan, storeSlug: cleanSlug, logoUrl, shippingCoverage })
      })
      
      if (res.ok) {
        alert('Identidad de Marca actualizada correctamente.')
        router.refresh()
      } else {
        alert('Hubo un error al guardar.')
      }
    } catch (err) {
      console.error(err)
      alert('Error de red al actualizar.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `ecommerce/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ecommerce-products')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('ecommerce-products')
        .getPublicUrl(filePath)

      setLogoUrl(publicUrlData.publicUrl)
    } catch (err: any) {
      console.error(err)
      alert('Error al subir el logo: ' + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) return <div className="p-4 text-slate-500 animate-pulse">Cargando configuración de E-Commerce...</div>

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm max-w-2xl">
      <div className="mb-4 text-slate-900 flex items-center gap-3">
         <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
           🏪
         </div>
         <div>
           <h2 className="text-xl font-bold">Personalización de Marca</h2>
           <p className="text-slate-600 text-sm font-medium">Cambia los logos y el nombre visible para tus clientes.</p>
         </div>
      </div>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Tienda</label>
            <input 
              type="text" 
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors bg-slate-50 text-slate-900" 
              placeholder="Ej. Mi Negocio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Eslogan Corto</label>
            <input 
              type="text" 
              value={storeSlogan}
              onChange={e => setStoreSlogan(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors bg-slate-50 text-slate-900" 
              placeholder="Tu mejor opción"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Enlace Único de la Tienda (Slug)</label>
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 overflow-hidden focus-within:border-blue-500 transition-colors">
              <span className="px-3 text-slate-500 bg-slate-100 border-r border-slate-300 text-sm h-full flex items-center">
                midominio.com/
              </span>
              <input 
                type="text" 
                value={storeSlug}
                onChange={e => setStoreSlug(e.target.value)}
                className="w-full p-2.5 outline-none bg-transparent text-slate-900" 
                placeholder="mi-tienda-online"
              />
            </div>
            {storeSlug && (
               <div className="mt-3">
                 <a href={`/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-xl transition-all shadow-sm">
                   👀 Ver mi Tienda Pública
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                   </svg>
                 </a>
               </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2 bg-slate-50/80 border border-slate-200 p-6 rounded-2xl mb-2 mt-4 space-y-6">
          <div>
            <label className="block text-lg font-bold text-slate-900">Cobertura de Despachos Geográfica</label>
            <p className="text-sm text-slate-600 mt-1 font-medium leading-relaxed">Configura exactamente hasta dónde entregas productos. Tus clientes del Carrito no podrán finalizar compras si están fuera de tu jurisdicción.</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={shippingCoverage.includes('Todo Chile')}
                onChange={(e) => {
                  if (e.target.checked) {
                     setShippingCoverage(['Todo Chile']) // Resetea y pone Todo Chile
                  } else {
                     setShippingCoverage([])
                  }
                }}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
              />
              <span className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">🚛 Despacho a Todo Chile Continental</span>
            </label>
            <p className="text-xs text-slate-500 ml-8 mt-1">Marca esta opción si utilizas couriers nacionales sin restricciones (Starken, Chilexpress).</p>
          </div>

          {!shippingCoverage.includes('Todo Chile') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm animate-fade-in">
               <h4 className="text-sm font-bold text-slate-800">Constructor de Zonas Restringidas</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector de Región */}
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500">Región</label>
                     <select 
                       value={selectedRegionUi}
                       onChange={e => setSelectedRegionUi(e.target.value)}
                       className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:border-blue-500 outline-none"
                     >
                        <option value="">-- Selecciona Región --</option>
                        {REGIONES_CHILE.map(r => (
                           <option key={r.region} value={r.region}>{r.region}</option>
                        ))}
                     </select>
                     
                     <button 
                       type="button"
                       disabled={!selectedRegionUi}
                       onClick={() => {
                          const val = `Región ${selectedRegionUi}`
                          if(!shippingCoverage.includes(val)) {
                            setShippingCoverage(prev => [...prev.filter(c => c !== 'Todo Chile'), val])
                          }
                          setSelectedRegionUi('')
                          setSelectedComunaUi('')
                       }}
                       className="w-full mt-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 py-2 rounded-lg transition"
                     >
                       + Añadir Región Completa
                     </button>
                  </div>

                  {/* Selector de Comuna */}
                  <div className="space-y-2 relative">
                     <label className="text-xs font-semibold text-slate-500">Comuna Específica</label>
                     <select 
                       value={selectedComunaUi}
                       onChange={e => setSelectedComunaUi(e.target.value)}
                       disabled={!selectedRegionUi}
                       className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:border-blue-500 outline-none disabled:opacity-50"
                     >
                        <option value="">-- Selecciona Comuna --</option>
                        {selectedRegionUi && REGIONES_CHILE.find(r => r.region === selectedRegionUi)?.comunas.map(c => (
                           <option key={c} value={c}>{c}</option>
                        ))}
                     </select>
                     
                     <button 
                       type="button"
                       disabled={!selectedComunaUi}
                       onClick={() => {
                          if(!shippingCoverage.includes(selectedComunaUi)) {
                            setShippingCoverage(prev => [...prev.filter(c => c !== 'Todo Chile'), selectedComunaUi])
                          }
                          setSelectedRegionUi('')
                          setSelectedComunaUi('')
                       }}
                       className="w-full mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 py-2 rounded-lg transition"
                     >
                       + Añadir Comuna Única
                     </button>
                  </div>
               </div>

            </div>
          )}

          {/* Listado de Píldoras Activas */}
          {shippingCoverage.length > 0 && !shippingCoverage.includes('Todo Chile') && (
            <div className="mt-4 p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30">
               <span className="block text-xs font-bold text-blue-800 mb-3">Tus Zonas de Despacho Actuales:</span>
               <div className="flex flex-wrap gap-2">
                 {shippingCoverage.map(zone => (
                    <span key={zone} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-blue-300 text-blue-900 shadow-sm">
                       {zone}
                       <button 
                         type="button" 
                         onClick={() => setShippingCoverage(prev => prev.filter(z => z !== zone))}
                         className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                       </button>
                    </span>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Subida Visual de Logotipo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo de la Tienda</label>
          <div className="flex items-center gap-4">
             {logoUrl ? (
                <div className="relative w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                  <img src={logoUrl} alt="Logo Prev" className="object-contain w-full h-full p-2" />
                  <button 
                    type="button" 
                    onClick={() => setLogoUrl('')} 
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
                  >
                    Borrar
                  </button>
                </div>
             ) : (
                <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                   </svg>
                   <span className="text-[10px] uppercase font-bold mt-1">Logo</span>
                </div>
             )}
             
             <div className="flex-1">
                <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
                  {uploadingLogo ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subiendo...
                    </>
                  ) : (
                    <>Subir Imagen 🖼️</>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                </label>
                <p className="text-xs text-slate-600 font-medium mt-2">Recomendado: Imagen cuadrada (PNG/JPG o transparente).</p>
             </div>
          </div>
        </div>

        {/* Previsualización del Enlace Activo (SaaS Multi-Tienda) */}
        {storeSlug && storeSlug.trim() !== '' && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
               <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                 </svg>
                 Tu Enlace de Tienda Oficial
               </h4>
               <p className="text-xs text-emerald-600/80 mt-0.5">Cópialo en tu Instagram o compártelo por WhatsApp.</p>
             </div>
             
             <a 
               href={`/${storeSlug}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center gap-2 shadow-sm"
             >
               Visitar mi Tienda
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
               </svg>
             </a>
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Aplicar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
