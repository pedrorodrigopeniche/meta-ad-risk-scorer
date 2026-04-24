import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meta Ad Risk Scorer',
  description: 'Evalúa el riesgo de rechazo de anuncios de Meta por política de medicamentos Rx',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} min-h-screen bg-background antialiased`}>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Meta Ad Risk Scorer</span>
              <span className="sm:hidden">Risk Scorer</span>
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/ideas" className="text-muted-foreground hover:text-foreground transition-colors">
                Aprendizajes
              </Link>
              <Link
                href="/nuevo"
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                + Nuevo
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
