import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Buscando productos de pdiazg46@gmail.com...')
  
  // 1. Verificar si el usuario existe y cuántos productos tiene (ignorando filtros web)
  const products = await prisma.product.findMany({
    where: {
      user: {
        email: 'pdiazg46@gmail.com'
      }
    }
  })

  console.log(`Se encontraron ${products.length} productos en la base de datos para este usuario.`)

  if (products.length === 0) {
    console.log('No hay productos en la base de datos para este usuario. Se necesita crear al menos uno.')
    // Crear un producto de prueba si no hay ninguno
    const user = await prisma.user.findUnique({
      where: { email: 'pdiazg46@gmail.com' }
    })
    
    if (user) {
      console.log('Creando producto de demostración...')
      await prisma.product.create({
        data: {
          name: 'Producto de Prueba Emprende',
          price: 15000,
          cost: 10000,
          stock: 50,
          isActiveOnline: true,
          stockEcommerce: 25,
          userId: user.id
        }
      })
      console.log('Producto de demostración creado exitosamente.')
    } else {
       console.log('ERROR: Usuario pdiazg46@gmail.com no existe en la base de datos. Imposible asociar productos.')
    }
    return
  }

  // 2. Actualizar todos los productos existentes para que aparezcan en la web
  const result = await prisma.product.updateMany({
    where: {
      user: {
        email: 'pdiazg46@gmail.com'
      }
    },
    data: {
      isActiveOnline: true,
      stockEcommerce: 50 // Darle 50 de stock a todos
    }
  })

  console.log(`¡Éxito! Se actualizaron ${result.count} productos. Ahora deberían ser visibles en el E-commerce.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
