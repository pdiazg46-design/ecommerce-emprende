'use client'

import { useEffect } from 'react'
import { useRealtimeStockStore } from '@/lib/realtime-stock-store'

interface ProductStockBadgeProps {
  productId: string
  initialStock: number
}

export function ProductStockBadge({ productId, initialStock }: ProductStockBadgeProps) {
  const initRealtime = useRealtimeStockStore(state => state.initializeRealtime)
  const realtimeStock = useRealtimeStockStore(state => state.stockMap[productId])

  useEffect(() => {
    initRealtime()
  }, [initRealtime])

  const currentStock = realtimeStock !== undefined ? realtimeStock : initialStock

  return (
    <div className={`absolute top-3 right-3 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm text-xs font-bold ${currentStock > 0 ? 'bg-white/90 text-slate-700' : 'bg-rose-500/95 text-white'}`}>
      {currentStock > 0 ? `${currentStock} disp.` : 'Agotado'}
    </div>
  )
}
