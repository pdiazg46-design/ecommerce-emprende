import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const algorithm = 'aes-256-cbc'

function decryptToken(encryptedToken: string): any {
    try {
        const secretKey = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-key-that-is-at-least-32-chars';
        
        // Crear un Hash Base64 de la llave secreta para forzar 32 bytes exactos (Debe ser idéntico al Emisor Hexagonal)
        const hashStr = crypto.createHash('sha256').update(String(secretKey)).digest('hex').substring(0, 32);
        const keyBuffer = Buffer.from(hashStr, 'utf8');
        
        const textParts = encryptedToken.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
        
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return JSON.parse(decrypted.toString('utf8'));
    } catch (e) {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=MissingToken', req.url))
    }

    const payload = decryptToken(token)

    if (!payload || !payload.email) {
        return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url))
    }

    // Verify token expiration to prevent replay attacks
    if (Date.now() > payload.exp) {
        return NextResponse.redirect(new URL('/login?error=TokenExpired', req.url))
    }

    const email = payload.email;

    // Supabase Admin injection
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Envolvemos todo en un Try-Catch maestro para evitar otro HTTP 500
    try {
        // Supabase require UUIDs. Emprende POS usa CUIDs.
        // EVITAMOS usar getUserById(userId) porque arroja excepcion fatal "Expected parameter to be UUID".
        
        // Let's generate a magic link directly by email.
        const siteUrl = 'https://ecommerce-emprende.vercel.app';
        let { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${siteUrl}/admin/ventas`
            }
        })

    if (error || !data?.properties?.action_link) {
        console.error("SSO Error linking to Supabase:", error);
        
        // Discrepancy Fix: El usuario existe en Prisma pero NO en Supabase.
        // Lo creamos silenciosamente para forzar el enlace.
        if (error?.message?.includes("User not found")) {
             console.log("SSO: Creando usuario sombra en Supabase");
             await supabaseAdmin.auth.admin.createUser({
                 email: email,
                 password: crypto.randomBytes(16).toString('hex'), 
                 email_confirm: true 
             })
             
             // Volvemos a intentar generar el link
             const siteUrl = 'https://ecommerce-emprende.vercel.app';
             const { data: retryData, error: retryError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email,
                options: {
                    redirectTo: `${siteUrl}/admin/ventas`
                }
             })

             if (retryError || !retryData?.properties?.action_link) {
                 return NextResponse.redirect(new URL('/login?error=SupabaseAdminSyncError', req.url))
             }

             return NextResponse.redirect(new URL(retryData.properties.action_link))
        }

        return NextResponse.redirect(new URL('/login?error=SupabaseAdminError', req.url))
    }

    // Redirect the user to the generated action link which automatically logs them in
    // and then redirects to /admin/ventas setting all the cookies on the way.
    return NextResponse.redirect(new URL(data.properties.action_link))

    } catch (criticalError: any) {
        console.error("SSO Critical Execution Error:", criticalError);
        return NextResponse.json({ 
            success: false, 
            error_message: criticalError?.message || String(criticalError),
            stack: criticalError?.stack,
            type: "Fatal SSO Crash"
        }, { status: 500 });
    }
}
