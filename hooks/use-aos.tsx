"use client"

import { useState, useEffect } from "react"

export function useAOS() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getAOSProps = (animation: string, delay = 0) => {
    if (!mounted) return {}

    const props: Record<string, string> = {
      "data-aos": animation,
    }

    if (delay > 0) {
      props["data-aos-delay"] = delay.toString()
    }

    return props
  }

  return { mounted, getAOSProps }
}

