'use client'

import { useEffect, useState } from 'react'

export default function AutoConfirmPayment({ orderId }: { orderId: string }) {
  const [hasFired, setHasFired] = useState(false)

  useEffect(() => {
    if (hasFired) return

    const confirmPayment = async () => {
      try {
        setHasFired(true)
        await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId, 
            status: 'PAID' 
          })
        })
      } catch (e) {
        console.error("Error auto-confirmando pago de MP desde Cliente:", e)
      }
    }

    confirmPayment()
  }, [hasFired, orderId])

  return null // Componente invisible
}
