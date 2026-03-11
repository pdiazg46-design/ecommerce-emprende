'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { useRealtimeStockStore } from '@/lib/realtime-stock-store'
import Link from 'next/link'

interface ProductClientViewProps {
  product: {
    id: string
    name: string
    price: number
    stockEcommerce: number
    stock: number
    imageUrl: string | null
    descriptionLong: string | null
  }
  storeSlug: string
}

export function ProductClientView({ product, storeSlug }: ProductClientViewProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore(state => state.addItem)
  const cartItems = useCartStore(state => state.items)
  
  const initRealtime = useRealtimeStockStore(state => state.initializeRealtime)
  const realtimeStock = useRealtimeStockStore(state => state.stockMap[product.id])

  useEffect(() => {
    initRealtime()
  }, [initRealtime])

  const currentStock = realtimeStock !== undefined ? realtimeStock : product.stock
  
  // Calcular cuánto de este producto ya está en el carrito para no exceder
  const inCart = cartItems.find(item => item.id === product.id)?.quantity || 0
  const maxAvailable = currentStock - inCart

  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= maxAvailable) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        imageUrl: product.imageUrl
      })
      
      // Mostrar retroalimentación visual momentánea
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
      
      // Reset local counter
      setQuantity(1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
          {product.name}
        </h1>
        <Link href={`/${storeSlug}`} className="text-slate-400 hover:text-slate-600">
           ✕
        </Link>
      </div>

      <p className="text-4xl font-black text-blue-600">
        ${product.price.toLocaleString('es-CL')}
      </p>

      {product.descriptionLong && (
        <div className="prose prose-slate text-sm">
          <p className="whitespace-pre-wrap">{product.descriptionLong}</p>
        </div>
      )}

      <div className="pt-6 border-t border-slate-100">
        {maxAvailable > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700">Cantidad:</span>
              <div className="flex items-center border border-slate-200 rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-slate-500 hover:bg-slate-50 transition"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1 text-slate-900 font-semibold text-center min-w-[3rem]">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(Math.min(maxAvailable, quantity + 1))}
                  className="px-3 py-1 text-slate-500 hover:bg-slate-50 transition"
                  disabled={quantity >= maxAvailable}
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">
                ({maxAvailable} disponibles)
              </span>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={added}
              className={`w-full font-bold py-4 rounded-xl active:scale-[0.98] transition-all flex justify-center items-center space-x-2 ${
                added 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {added ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>¡Añadido al Carrito!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <span>Añadir al Carrito</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-orange-50 text-orange-700 p-4 rounded-xl border border-orange-100 flex items-center space-x-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
             </svg>
             <div>
               <p className="font-bold">Agotado Temporalmente</p>
               <p className="text-sm opacity-90">No hay suficiente stock online en este momento.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
