"use client"

import { useEffect, useRef } from "react"

interface SourceData {
  name: string
  value: number
}

interface SourcesBarChartProps {
  data: SourceData[]
  height?: number
}

export function SourcesBarChart({ data, height = 200 }: SourcesBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const parentWidth = canvas.parentElement?.clientWidth || 300
    canvas.width = parentWidth * dpr
    canvas.height = height * dpr
    canvas.style.width = `${parentWidth}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, parentWidth, height)

    // Calculate dimensions
    const maxValue = Math.max(...data.map((item) => item.value))
    const barCount = data.length
    const barWidth = (parentWidth - 60) / (barCount * 2)
    const barSpacing = barWidth

    // Draw grid lines and labels
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.textAlign = "right"
    ctx.font = "10px sans-serif"

    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = height - 30 - (i * (height - 60)) / gridLines
      ctx.beginPath()
      ctx.moveTo(40, y)
      ctx.lineTo(parentWidth - 10, y)
      ctx.stroke()

      const value = Math.round((i * maxValue) / gridLines)
      ctx.fillText(value.toString(), 35, y + 4)
    }

    // Draw bars
    data.forEach((item, index) => {
      const x = 50 + index * (barWidth + barSpacing)
      const barHeight = (item.value / maxValue) * (height - 60)
      const y = height - 30 - barHeight

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - 30)
      gradient.addColorStop(0, "#06B6D4") // Cyan at top
      gradient.addColorStop(1, "rgba(6, 182, 212, 0.5)") // Transparent cyan at bottom

      // Draw bar
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.rect(x, y, barWidth, barHeight)
      ctx.fill()

      // Draw source label
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.textAlign = "center"
      ctx.fillText(`Source ${index + 1}`, x + barWidth / 2, height - 10)
    })
  }, [data, height])

  return (
    <div className="w-full">
      <canvas ref={canvasRef} width="100%" height={height} />
    </div>
  )
}

