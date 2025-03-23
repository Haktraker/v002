"use client"

import { useEffect, useRef } from "react"

export function DashboardMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Draw world map (simplified)
    const drawMap = () => {
      if (!ctx) return

      // Background
      ctx.fillStyle = "#0A0E17"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid lines
      ctx.strokeStyle = "#1E2A45"
      ctx.lineWidth = 0.5

      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Simplified continents (just for visualization)
      ctx.fillStyle = "#1E2A45"

      // North America
      ctx.beginPath()
      ctx.ellipse(
        canvas.width * 0.25,
        canvas.height * 0.4,
        canvas.width * 0.15,
        canvas.height * 0.15,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      // South America
      ctx.beginPath()
      ctx.ellipse(canvas.width * 0.3, canvas.height * 0.7, canvas.width * 0.08, canvas.height * 0.15, 0, 0, Math.PI * 2)
      ctx.fill()

      // Europe
      ctx.beginPath()
      ctx.ellipse(canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.08, canvas.height * 0.1, 0, 0, Math.PI * 2)
      ctx.fill()

      // Africa
      ctx.beginPath()
      ctx.ellipse(canvas.width * 0.5, canvas.height * 0.6, canvas.width * 0.1, canvas.height * 0.15, 0, 0, Math.PI * 2)
      ctx.fill()

      // Asia
      ctx.beginPath()
      ctx.ellipse(
        canvas.width * 0.65,
        canvas.height * 0.4,
        canvas.width * 0.15,
        canvas.height * 0.15,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      // Australia
      ctx.beginPath()
      ctx.ellipse(canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.07, canvas.height * 0.07, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Threat hotspots
    const hotspots = [
      { x: canvas.width * 0.25, y: canvas.height * 0.35, intensity: 0.8 }, // North America
      { x: canvas.width * 0.5, y: canvas.height * 0.3, intensity: 0.6 }, // Europe
      { x: canvas.width * 0.7, y: canvas.height * 0.4, intensity: 0.9 }, // Asia
      { x: canvas.width * 0.5, y: canvas.height * 0.6, intensity: 0.5 }, // Africa
      { x: canvas.width * 0.3, y: canvas.height * 0.7, intensity: 0.4 }, // South America
      { x: canvas.width * 0.8, y: canvas.height * 0.7, intensity: 0.3 }, // Australia
    ]

    // Draw threat hotspots
    const drawHotspots = () => {
      if (!ctx) return

      hotspots.forEach((spot) => {
        // Glow effect
        const gradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 50 * spot.intensity)

        gradient.addColorStop(0, `rgba(255, 62, 62, ${spot.intensity})`)
        gradient.addColorStop(1, "rgba(255, 62, 62, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(spot.x, spot.y, 50 * spot.intensity, 0, Math.PI * 2)
        ctx.fill()

        // Center point
        ctx.fillStyle = "#FF3E3E"
        ctx.beginPath()
        ctx.arc(spot.x, spot.y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Connection lines between hotspots
    const drawConnections = () => {
      if (!ctx) return

      for (let i = 0; i < hotspots.length; i++) {
        for (let j = i + 1; j < hotspots.length; j++) {
          if (Math.random() > 0.7) continue // Only draw some connections

          const start = hotspots[i]
          const end = hotspots[j]

          // Create gradient line
          const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
          gradient.addColorStop(0, `rgba(255, 62, 62, ${start.intensity * 0.5})`)
          gradient.addColorStop(1, `rgba(255, 62, 62, ${end.intensity * 0.5})`)

          ctx.strokeStyle = gradient
          ctx.lineWidth = 1

          // Draw dashed line
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    }

    // Animation
    const animate = () => {
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw map elements
      drawMap()
      drawConnections()
      drawHotspots()

      // Animate hotspots
      hotspots.forEach((spot) => {
        spot.intensity = 0.3 + Math.sin(Date.now() * 0.001 + spot.x) * 0.2
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

