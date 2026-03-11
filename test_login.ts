import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function confirmarEmailManualmente() {
  const email = 'pdiazg46@gmail.com'
  
  console.log(`Bypass de Confirmación de Correo 2.0: Habilitando ${email}...`)
  
  try {
    const res = await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW()
      WHERE email = $1
    `, email)
    
    console.log(`✅ Cuenta verificada a la fuerza en PostgreSQL. (Filas afectadas: ${res})`)
  } catch (error) {
    console.error('❌ Error alterando auth.users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

confirmarEmailManualmente()
