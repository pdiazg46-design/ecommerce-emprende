'use client'

import { useCartStore } from '@/lib/cart-store'
import { useEffect, useState } from 'react'

export function CartBadge() {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore(state => state.items)
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || totalItems === 0) return null

  return (
    <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
      {totalItems}
    </div>
  )
}
