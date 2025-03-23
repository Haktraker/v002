"use client"

import { useState, useEffect } from "react"
import { ClockIcon } from "lucide-react"

export function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200">
      <ClockIcon className="h-4 w-4 mr-1" />
      <span>{time.toLocaleTimeString()}</span>
    </div>
  )
}

