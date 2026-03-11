import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const products = await prisma.product.findMany({ take: 1 })
    console.log("Prisma connection success!", products)
  } catch (e) {
    console.error("PRISMA INITIALIZATION ERROR:")
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
