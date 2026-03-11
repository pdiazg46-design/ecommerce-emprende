'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function ImageUploader({ 
  productId, 
  currentImage,
  onUploadSuccess
}: { 
  productId: string, 
  currentImage: string | null,
  onUploadSuccess: (newUrl: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      setUploading(true)

      const file = event.target.files?.[0]
      if (!file) return

      // Definir la extensión y un nombre único
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `ecommerce/${fileName}`

      // Subir a Supabase Storage (Asume un bucket público llamado 'ecommerce-products')
      const { error: uploadError, data } = await supabase.storage
        .from('ecommerce-products')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Obtener la URL pública real
      const { data: publicUrlData } = supabase.storage
        .from('ecommerce-products')
        .getPublicUrl(filePath)

      const imageUrl = publicUrlData.publicUrl

      // Guardar URL en Prisma mediante nuestra API Server-side
      const response = await fetch(`/api/admin/productos/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar la base de datos')
      }

      onUploadSuccess(imageUrl)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative group overflow-hidden bg-slate-100 rounded-xl aspect-square border border-slate-200 border-dashed flex items-center justify-center transition-all hover:bg-slate-50 hover:border-blue-400">
        {currentImage ? (
          <img src={currentImage} alt="Producto" className="object-cover w-full h-full" />
        ) : (
          <div className="text-slate-400 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6.827 6.175 1.053-1.052a2.032 2.032 0 0 1 1.442-.596h5.356c.54 0 1.058.214 1.442.596l1.053 1.052c.383.383.902.596 1.442.596h1.306A2.25 2.25 0 0 1 21 8.25v9a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25v-9A2.25 2.25 0 0 1 5.25 6h1.306c.54 0 1.058-.214 1.442-.596Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
            <span className="text-xs font-medium">Sin Foto</span>
          </div>
        )}
        
        {/* Capa de Hover / Cargando */}
        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
           <span className="text-white text-sm font-semibold flex items-center gap-2">
             {uploading ? (
               <>
                 <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Subiendo...
               </>
             ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                 </svg>
                 Elegir Foto
               </>
             )}
           </span>
           <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             onChange={uploadImage} 
             disabled={uploading}
           />
        </label>
      </div>
      {error && <p className="text-red-500 text-xs font-semibold px-1">{error}</p>}
    </div>
  )
}
