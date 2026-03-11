import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetearPassword() {
  const email = 'pdiazg46@gmail.com'
  const nuevaClave = 'Emprende2026!'
  
  try {
    // Supabase GoTrue requiere rounds=10 para Bcrypt
    // Usaremos pgcrypto explícitamente con cost 10
    const res = await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET encrypted_password = crypt($1, gen_salt('bf', 10))
      WHERE email = $2
    `, nuevaClave, email)
    
    console.log('✅ Clave forzada con Bcrypt Cost 10. Rows affected:', res)
  } catch (error) {
    console.error('❌ Error inyectando la clave en auth:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetearPassword()
