import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client"
import { QueryProvider } from "@/providers/query-client"
import { LoadingProvider } from "@/lib/context/loading-context"
import './globals.css'

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
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <LoadingProvider>
            <ClientLayout>{children}</ClientLayout>
          </LoadingProvider>
        </QueryProvider>
      </body>
    </html>
  )
}