"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

// Use React.ComponentProps to infer props from the provider component
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

// Your simplified ThemeProvider component
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" // Ensure attribute is class for Tailwind
      defaultTheme="system" // Sensible default
      enableSystem // Allow system preference
      disableTransitionOnChange // Often helps prevent flashing
      {...props} // Pass through any other props like storageKey
    >
      {children}
    </NextThemesProvider>
  )
}

// Re-export the useTheme hook directly from next-themes
// Components importing useTheme from here will now get the correct hook
export const useTheme = useNextTheme

