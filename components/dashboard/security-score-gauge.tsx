"use client"

import { useEffect, useRef } from "react"

interface SecurityScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
}

export function SecurityScoreGauge({ score, size = 220, strokeWidth = 20 }: SecurityScoreGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions considering device pixel ratio
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    const centerX = size / 2
    const centerY = size / 2
    const radius = (size - strokeWidth) / 2

    // Draw background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = "rgba(138, 44, 226, 0.2)"
    ctx.lineWidth = strokeWidth
    ctx.stroke()

    // Calculate end angle based on score
    const endAngle = (score / 100) * 2 * Math.PI

    // Create gradient for the progress arc
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, "#8A2CE2") // Purple
    gradient.addColorStop(1, "#c44af3") // Lighter purple

    // Draw progress arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle - Math.PI / 2)
    ctx.strokeStyle = gradient
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.stroke()

    // Draw dot at the end of the progress
    const dotX = centerX + radius * Math.cos(endAngle - Math.PI / 2)
    const dotY = centerY + radius * Math.sin(endAngle - Math.PI / 2)

    ctx.beginPath()
    ctx.arc(dotX, dotY, strokeWidth / 2, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()
  }, [score, size, strokeWidth])

  return (
    <div className="relative flex items-center justify-center">
      <canvas ref={canvasRef} width={size} height={size} />
      <div className="absolute flex flex-col items-center justify-center">
        <p className="text-5xl font-bold">{score}%</p>
        <p className="text-sm text-muted-foreground mt-2">Your Security Score</p>
      </div>
    </div>
  )
}

