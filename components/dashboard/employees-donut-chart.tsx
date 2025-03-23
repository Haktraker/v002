"use client"

import { useEffect, useRef } from "react"

interface EmployeeGroup {
  label: string
  value: number
  color: string
}

interface EmployeesDonutChartProps {
  data: EmployeeGroup[]
  size?: number
}

export function EmployeesDonutChart({ data, size = 200 }: EmployeesDonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
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
    const outerRadius = size / 2 - 10
    const innerRadius = outerRadius * 0.6

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.value, 0)

    // Draw arcs
    let startAngle = -Math.PI / 2

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI
      const endAngle = startAngle + sliceAngle

      // Draw slice
      ctx.beginPath()
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
      ctx.closePath()

      ctx.fillStyle = item.color
      ctx.fill()

      startAngle = endAngle
    })

    // Draw center circle (black hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius - 1, 0, 2 * Math.PI)
    ctx.fillStyle = "#0A0E17" // Dark background color
    ctx.fill()
  }, [data, size])

  return (
    <div className="relative flex items-center justify-center">
      <canvas ref={canvasRef} width={size} height={size} />
      <div className="absolute">
        <h3 className="text-center font-semibold">Employees</h3>
      </div>
    </div>
  )
}

