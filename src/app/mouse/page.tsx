"use client"

import type React from "react"
import { useState, useEffect } from "react"
import '../mouse/mouse.css'

export default function LoginPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Actualiza la posición del mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      {/* Nave que sigue al mouse */}
      <div
        className="ufo"
        style={{
          position: 'absolute',
          top: `${mousePosition.y - 10}px`, // Mantener la posición Y centrada
          left: `${mousePosition.x + 15}px`, // Aumentar la posición X para mover la nave a la derecha
        }}
      ></div>
    </div>
  )
}
