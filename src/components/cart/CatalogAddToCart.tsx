'use client'

import { useCartStore } from '@/lib/cart-store'
import { MouseEvent, useEffect } from 'react'
import { useRealtimeStockStore } from '@/lib/realtime-stock-store'

interface CatalogAddToCartProps {
  product: {
    id: string
    name: string
    price: number
    imageUrl?: string | null
    stock: number // Referencia inicial
  }
}

export function CatalogAddToCart({ product }: CatalogAddToCartProps) {
  const addItem = useCartStore(state => state.addItem)
  const initRealtime = useRealtimeStockStore(state => state.initializeRealtime)
  const realtimeStock = useRealtimeStockStore(state => state.stockMap[product.id])

  useEffect(() => {
    initRealtime()
  }, [initRealtime])

  const currentStock = realtimeStock !== undefined ? realtimeStock : product.stock

  const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() 
    e.stopPropagation() 
    
    if (currentStock <= 0) return
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    })
  }

  if (currentStock <= 0) {
    return (
      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 flex items-center justify-center">
        Agotado
      </span>
    )
  }

  return (
    <button 
      onClick={handleAddToCart}
      className="bg-slate-900 text-white p-2 border border-slate-900 rounded-xl hover:bg-white hover:text-slate-900 transition-colors active:scale-95 shadow-sm"
      title={`Agregar ${product.name} al carrito`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  )
}
