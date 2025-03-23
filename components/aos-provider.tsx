"use client"

import { useEffect, useState, type ReactNode } from "react"
import AOS from "aos"
import "aos/dist/aos.css"

export function AOSProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize AOS only once on the client side
    AOS.init({
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      delay: 50,
      duration: 750,
      disable: "mobile", // Disable on mobile devices to prevent performance issues
    })

    setIsInitialized(true)

    // Refresh AOS on window resize
    const handleResize = () => {
      AOS.refresh()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Return children directly to avoid hydration mismatch
  return <>{children}</>
}

