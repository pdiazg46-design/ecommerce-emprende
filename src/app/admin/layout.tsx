import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Catálogo Emprende",
  description: "Gestión de catálogo centralizada para Emprende",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
