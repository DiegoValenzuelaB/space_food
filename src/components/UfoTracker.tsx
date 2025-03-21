"use client"

import { useState, useEffect, useRef } from "react"
import "../app/globals.css"

export default function LoginPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [ufoPosition, setUfoPosition] = useState({ x: 0, y: 0 }) // Posición suavizada
  const ufoRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  useEffect(() => {
    let animationFrameId: number

    const updatePosition = () => {
      setUfoPosition((prev) => ({
        x: prev.x + (mousePosition.x - prev.x) * 0.05, // Ajusta 0.05 para cambiar la velocidad
        y: prev.y + (mousePosition.y - prev.y) * 0.05,
      }))
      animationFrameId = requestAnimationFrame(updatePosition)
    }

    updatePosition()

    return () => cancelAnimationFrame(animationFrameId)
  }, [mousePosition])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      {/* Nave que sigue al mouse con retraso */}
      <div
        ref={ufoRef}
        className="ufo"
        style={{
          position: "absolute",
          top: `${ufoPosition.y - 10}px`,
          left: `${ufoPosition.x + 60}px`,
          transform: "translate(-50%, -50%)",
          transition: "none", // Evitar el delay predeterminado de CSS
        }}
      ></div>
    </div>
  )
}
