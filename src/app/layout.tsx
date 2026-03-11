import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from 'next/link'
import { CartBadge } from '@/components/cart/CartBadge'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "E-Commerce Emprende",
  description: "La extensión de tienda online para el ecosistema Emprende.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        {/* Navbar Global (Para páginas que no sean Home) */}
        <div id="portal-root"></div>
        {children}
      </body>
    </html>
  )
}
