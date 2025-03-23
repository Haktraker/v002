"use client"

import { useEffect, useRef, useState } from "react"

// Define TypeScript interfaces for better type safety
interface NodeSpeed {
  x: number
  y: number
}

interface NodeProps {
  x: number
  y: number
  radius: number
  color: string
  isInfected: boolean
}

class Node {
  x: number
  y: number
  radius: number
  color: string
  connections: Node[]
  speed: NodeSpeed
  isInfected: boolean
  pulseRadius: number
  pulseOpacity: number
  
  constructor({ x, y, radius, color, isInfected = false }: NodeProps) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.connections = []
    this.speed = {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
    }
    this.isInfected = isInfected
    this.pulseRadius = radius
    this.pulseOpacity = 1
  }

  update(canvasWidth: number, canvasHeight: number) {
    // Move node
    this.x += this.speed.x
    this.y += this.speed.y

    // Bounce off edges
    if (this.x <= this.radius || this.x >= canvasWidth - this.radius) {
      this.speed.x *= -1
    }

    if (this.y <= this.radius || this.y >= canvasHeight - this.radius) {
      this.speed.y *= -1
    }

    // Update pulse effect for infected nodes
    if (this.isInfected) {
      this.pulseRadius += 0.5
      this.pulseOpacity -= 0.01

      if (this.pulseOpacity <= 0) {
        this.pulseRadius = this.radius
        this.pulseOpacity = 1
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw connections
    this.connections.forEach((node) => {
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(node.x, node.y)

      const gradient = ctx.createLinearGradient(this.x, this.y, node.x, node.y)

      if (this.isInfected || node.isInfected) {
        gradient.addColorStop(0, "rgba(138, 44, 226, 0.2)")
        gradient.addColorStop(1, "rgba(138, 44, 226, 0)")
      } else {
        gradient.addColorStop(0, "rgba(6, 182, 212, 0.2)")
        gradient.addColorStop(1, "rgba(6, 182, 212, 0)")
      }

      ctx.strokeStyle = gradient
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw pulse for infected nodes
    if (this.isInfected) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.pulseRadius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(138, 44, 226, ${this.pulseOpacity * 0.3})`
      ctx.fill()
    }

    // Draw node
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.isInfected ? "rgb(138, 44, 226)" : this.color
    ctx.fill()
  }
}

export function ThreatMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const animationRef = useRef<number>()
  const nodesRef = useRef<Node[]>([])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with higher performance approach
    const setCanvasDimensions = () => {
      const { innerWidth, innerHeight } = window
      const dpr = window.devicePixelRatio || 1
      
      // Set display size (css pixels)
      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
      
      // Set actual size in memory (scaled for retina/high-DPI displays)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      
      // Scale all drawing operations by dpr
      ctx.scale(dpr, dpr)
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Create nodes - calculate based on screen size for responsive behavior
    const createNodes = () => {
      const nodeCount = Math.floor((canvas.width * canvas.height) / 25000) // Slightly reduced for performance
      nodesRef.current = []

      for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * (canvas.width / (window.devicePixelRatio || 1))
        const y = Math.random() * (canvas.height / (window.devicePixelRatio || 1))
        const radius = Math.random() * 2 + 2
        const isInfected = Math.random() < 0.2
        const color = isInfected ? "rgb(138, 44, 226)" : "rgb(6, 182, 212)"

        nodesRef.current.push(new Node({ x, y, radius, color, isInfected }))
      }
    }

    // Create connections between nodes
    const createConnections = () => {
      nodesRef.current.forEach((node) => {
        const connectionCount = Math.floor(Math.random() * 3) + 1

        for (let i = 0; i < connectionCount; i++) {
          const randomNode = nodesRef.current[Math.floor(Math.random() * nodesRef.current.length)]

          if (randomNode !== node && !node.connections.includes(randomNode)) {
            node.connections.push(randomNode)
          }
        }
      })
    }

    // Initialize
    createNodes()
    createConnections()

    // Optimized animation loop with RAF
    const animate = () => {
      if (!ctx || !canvas || !isVisible) return
      
      ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))

      // Update and draw nodes
      nodesRef.current.forEach((node) => {
        node.update(canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))
        node.draw(ctx)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Implement intersection observer for better performance
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (canvas) {
      observer.observe(canvas)
    }

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", setCanvasDimensions)
      if (canvas) {
        observer.unobserve(canvas)
      }
      observer.disconnect()
    }
  }, [isVisible])

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full" 
      style={{ opacity: 0.7 }} 
      aria-hidden="true"
    />
  )
}

