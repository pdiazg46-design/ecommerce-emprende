import { create } from 'zustand'
import { createClient } from '@/lib/supabase-client'

interface RealtimeStockState {
  stockMap: Record<string, number>
  initializeRealtime: () => void
}

export const useRealtimeStockStore = create<RealtimeStockState>((set, get) => ({
  stockMap: {},
  initializeRealtime: () => {
    // Only initialize once to prevent multiple duplicate subscriptions
    const supabase = createClient()
    const channelName = 'public:Product'
    
    // Check if we are already subscribed to avoid memory leaks on remount
    const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`)
    if (existingChannel) return;

    const channel = supabase.channel(channelName)
    
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'Product' },
      (payload) => {
        const updatedProduct = payload.new as any
        if (updatedProduct && updatedProduct.id) {
           set((state) => ({
             stockMap: {
               ...state.stockMap,
               [updatedProduct.id]: updatedProduct.stock
             }
           }))
        }
      }
    ).subscribe((status) => {
       if (status === 'SUBSCRIBED') {
         console.log('🔗 Stock Realtime Sync Active')
       }
    })
  }
}))
