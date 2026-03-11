'use client'

import { useEffect, useState } from 'react'

export default function AutoConfirmPayment({ orderId }: { orderId: string }) {
  const [hasFired, setHasFired] = useState(false)

  useEffect(() => {
    if (hasFired) return

    const confirmPayment = async () => {
      try {
        setHasFired(true)
        const response = await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId, 
            status: 'PAID' 
          })
        })

        if (!response.ok) {
           const errData = await response.json()
           console.error("[TRIPODE VERCEL ERROR]", errData)
           alert("Alerta Administrativa: El pago llegó bien, pero tu tienda falló al descontar el inventario (" + errData.error + "). Usa el ID: " + orderId)
        }
      } catch (e) {
        console.error("Error catastrófico en auto-confirmación:", e)
        alert("Error de Red al intentar consolidar tu pago: " + (e as Error).message)
      }
    }

    confirmPayment()
  }, [hasFired, orderId])

  return null // Componente invisible
}
