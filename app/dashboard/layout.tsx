"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Toaster } from "@/components/ui/toaster"
import ProtectedRoute from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto bg-[hsl(var(--dashboard-bg))] p-1 sm:p-2 md:p-4 lg:p-6">
            <div className="container max-w-[1600px] h-full ">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </ProtectedRoute>
  )
}
