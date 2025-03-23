"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { AOSProvider } from "@/components/aos-provider"
import { SessionInitializer } from "@/components/session-initializer"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} disableTransitionOnChange>
          <AuthProvider>
            <AOSProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
              <Toaster position="top-right" />
              <SessionInitializer />
            </AOSProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

