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

const STORAGE_KEY = "theme-preference" // Consistent storage key across the app

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    
    // Get theme from localStorage
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null
      if (storedTheme && ["dark", "light", "system"].includes(storedTheme)) {
        setTheme(storedTheme)
      }
    } catch (error) {
      console.error("Error reading theme from localStorage:", error)
    }

    // Check if we're in dark mode
    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches && theme === "system")

    setIsDarkMode(isDark)
  }, [storageKey, theme])

  // Update localStorage when theme changes
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    try {
      localStorage.setItem(storageKey, newTheme)
      
      // Force apply theme class to document
      if (newTheme === "dark" || (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark")
        document.documentElement.classList.remove("light")
      } else {
        document.documentElement.classList.add("light")
        document.documentElement.classList.remove("dark")
      }
    } catch (error) {
      console.error("Error saving theme to localStorage:", error)
    }
  }

  // Listen for theme changes
  useEffect(() => {
    if (!mounted) return

    const handleThemeChangeObserver = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark"

      setIsDarkMode(isDark)
    }

    // Set up a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver(handleThemeChangeObserver)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })

    // Also listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setIsDarkMode(e.matches)
      }
    }
    
    mediaQuery.addEventListener("change", handleMediaChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", handleMediaChange)
    }
  }, [mounted, theme])

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
          setTheme: handleThemeChange,
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

