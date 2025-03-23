"use client"

import { useState, useEffect } from "react"
import AOS from "aos"
import { usePathname } from "next/navigation"

interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Check if current page should have AOS disabled
  const disableAOS = ["/company", "/solutions", "/products", "/partners", "/pricing"].some((path) =>
    pathname.startsWith(path),
  )

  useEffect(() => {
    setMounted(true)
    // Refresh AOS after mounting to detect newly added data-aos attributes
    if (typeof window !== "undefined") {
      setTimeout(() => {
        AOS.refresh()
      }, 100)
    }
  }, [])

  return (
    <section className="py-16 bg-white dark:bg-dark-bg border-b border-purple-10 dark:border-purple-30 relative z-30">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4 cyber-gradient relative"
          {...(mounted && !disableAOS ? { "data-aos": "fade-up" } : {})}
        >
          {title}
        </h1>
        <p
          className="text-xl text-foreground/80 dark:text-white-85 max-w-2xl mx-auto relative"
          {...(mounted && !disableAOS ? { "data-aos": "fade-up", "data-aos-delay": "100" } : {})}
        >
          {description}
        </p>
      </div>
    </section>
  )
}

