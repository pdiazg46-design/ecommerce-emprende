'use client'

import { useCartStore } from '@/lib/cart-store'
import { MouseEvent } from 'react'

interface CatalogAddToCartProps {
  product: {
    id: string
    name: string
    price: number
    imageUrl?: string | null
    stock: number // Referencia para futuras validaciones si se desea
  }
}

export function CatalogAddToCart({ product }: CatalogAddToCartProps) {
  const addItem = useCartStore(state => state.addItem)

  const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Detener la navegación del <Link> envolvente
    e.stopPropagation() // Evitar propagación al contenedor
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    })
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
