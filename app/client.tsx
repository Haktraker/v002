"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { AOSProvider } from "@/components/aos-provider"
import { SessionInitializer } from "@/components/session-initializer"
import dynamic from 'next/dynamic'

// Import AuthChatbot dynamically to avoid SSR issues
const AuthChatbot = dynamic(() => import('@/components/auth-chatbot'), { 
  ssr: false,
  loading: () => null 
});

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} storageKey="theme-preference" disableTransitionOnChange>
      <AuthProvider>
        <AOSProvider>
          <div className={`${inter.className} flex flex-col min-h-screen`}>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <SessionInitializer />
          <AuthChatbot />
        </AOSProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
