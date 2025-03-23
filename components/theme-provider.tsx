"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemeProvider } from "next-themes"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isDarkMode: true,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true)

    // Check if we're in dark mode
    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches && theme === "system")

    setIsDarkMode(isDark)
  }, [theme])

  // Listen for theme changes
  useEffect(() => {
    if (!mounted) return

    const handleThemeChange = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark"

      setIsDarkMode(isDark)
    }

    // Set up a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver(handleThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })

    return () => observer.disconnect()
  }, [mounted])

  if (!mounted) {
    // Avoid rendering with incorrect theme
    return <>{children}</>
  }

  return (
    <NextThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      storageKey={storageKey}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      <ThemeProviderContext.Provider
        value={{
          theme,
          setTheme: (t) => setTheme(t),
          isDarkMode,
        }}
      >
        {children}
      </ThemeProviderContext.Provider>
    </NextThemeProvider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

