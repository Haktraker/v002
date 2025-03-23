"use client"

import { type ReactNode, useState, useEffect } from "react"

interface CompanyValueProps {
  icon: ReactNode
  title: string
  description: string
  index: number
}

export function CompanyValue({ icon, title, description, index }: CompanyValueProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className="bg-card p-6 rounded-lg transition-colors"
      {...(mounted ? { "data-aos": "fade-up", "data-aos-delay": `${index * 100}` } : {})}
    >
      <div className="mb-4 bg-muted/30 p-4 rounded-md inline-block">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-foreground/80">{description}</p>
    </div>
  )
}

