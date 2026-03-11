'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function BrandConfig() {
  const [storeName, setStoreName] = useState('EMPRENDE')
  const [storeSlogan, setStoreSlogan] = useState('Tu visión, nuestra tecnología')
  const [storeSlug, setStoreSlug] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
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
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Limpiar el slug para que sea url-friendly
      const cleanSlug = storeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      
      const res = await fetch('/api/ecommerce-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, storeSlogan, storeSlug: cleanSlug, logoUrl })
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
            <p className="text-xs text-slate-600 font-medium mt-1.5">Usa solo minúsculas, números o guiones. Este será el link que compartirás a tus clientes.</p>
          </div>
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
