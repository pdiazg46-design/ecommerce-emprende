import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetEcommerceSales() {
  console.log('Iniciando script de purga de ventas E-commerce (Ventas Web)...')

  try {
    // 1. Encontrar todas las transacciones marcadas como "WEB_SALE"
    // Estas son las que se envían directamente al historial central de "Actividad de Hoy"
    const webSales = await prisma.transaction.findMany({
      where: {
        type: 'WEB_SALE'
      }
    })

    console.log(`Se encontraron ${webSales.length} transacciones de tipo WEB_SALE.`)

    if (webSales.length > 0) {
      const deletedWebSales = await prisma.transaction.deleteMany({
        where: {
          type: 'WEB_SALE'
        }
      })
      console.log(`Eliminadas ${deletedWebSales.count} transacciones (Tripode Emprende POS).`)
    }

    // 2. Encontrar y Eliminar directamente todas las Ordenes de E-commerce
    // Esto limpia la tabla EcommerceOrder y, en cascada, la tabla OrderItem vinculada
    // NO tocamos la tabla Product (donde reside el inventario y stockEcommerce).
    const ecommerceOrders = await prisma.ecommerceOrder.findMany()
    console.log(`Se encontraron ${ecommerceOrders.length} ordenes en el panel de E-commerce.`)

    if (ecommerceOrders.length > 0) {
        const deletedOrders = await prisma.ecommerceOrder.deleteMany()
        console.log(`Eliminadas ${deletedOrders.count} ordenes del BackOffice Web.`)
    }

    console.log('¡Purga completada exitosamente! El inventario está intacto.')

  } catch (error) {
    console.error('Error crítico durante la purga:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetEcommerceSales()
