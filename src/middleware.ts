import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Crear el cliente servidor-side para middleware (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener status de la sesión actual refrescando token si caducó
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger RUTAS de ADMINISTRADOR (/admin/*)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  if (isAdminRoute && !user) {
    // Usuario no loggeado intenta entrar al admin -> Lo mandamos al login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Opcional: Si está loggeado y va al /login, enviarlo al dashboard
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')
  if (isLoginRoute && user) {
     const url = request.nextUrl.clone()
     url.pathname = '/admin/catalogo'
     return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - _next/static (archivos estáticos base)
     * - _next/image (optimización de imgs)
     * - favicon.ico
     * - extensiones de medias
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


