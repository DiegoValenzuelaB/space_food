import "./globals.css"
import UfoTracker from "@/components/UfoTracker"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <UfoTracker /> {/* Aquí añadimos la nave en TODAS las páginas */}
      </body>
    </html>
  )
}
