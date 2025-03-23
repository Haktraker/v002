import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client"

export const metadata: Metadata = {
  title: "Haktrak Networks - AI-Powered XCI Platform",
  description:
    "Advanced eXtended Cyber Intelligence platform providing actionable and contextualized intelligence for cyber threat protection.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}



import './globals.css'