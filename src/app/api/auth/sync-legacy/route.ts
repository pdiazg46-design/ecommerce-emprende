import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Inicializamos cliente administrador asíncrono con poderes absolutos (Bypass RLS/Auth)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    // 1. Buscamos al usuario en la base de datos histórica (Emprende POS)
    const userLegacy = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!userLegacy || !userLegacy.password) {
      return NextResponse.json({ error: 'Usuario no existe en la base de datos principal de Emprende' }, { status: 404 })
    }

    // 2. Comparamos que la clave ingresada sea la real antigua usando Bcrypt
    const passwordMatch = await bcrypt.compare(password, userLegacy.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    // 3. ¡Si llegamos aquí, la clave era correcta en el POS! 
    // Ahora inyectamos esta nueva alma a la Bóveda de Supabase Auth con los mismos datos
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // No mandar correos de validación, forzar creación
      user_metadata: {
        migratedFromLegacy: true,
        originalUserId: userLegacy.id
      }
    })

    if (authError) {
       // Si el error es que ya existía (código tipificado en auth), significa que ya lo habían migrado
       if(authError.message.includes('already registered')) {
          // Intentaremos actualizarle la clave por si la había cambiado en el POS
           const { data: users } = await supabaseAdmin.auth.admin.listUsers()
           const existingUser = users.users.find(u => u.email === email.toLowerCase())
           if(existingUser) {
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: password })
              return NextResponse.json({ success: true, message: 'Clave sincronizada' })
           }
       }
       console.error("Supabase Admin Error:", authError)
       return NextResponse.json({ error: 'Error interno en la bóveda de autenticación: ' + authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Identidad migrada y vinculada con éxito' })

  } catch (error: any) {
    console.error('Error en Sync Legacy API:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
