"use client"

import type React from "react"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { Skeleton } from '@/components/ui/skeleton'; // Or use a dedicated spinner component

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Toaster } from "@/components/ui/toaster"
import ProtectedRoute from "@/components/auth/protected-route"
import { GlobalFilterProvider } from "@/lib/context/GlobalFilterContext"; // Import the provider

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth status is determined
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex h-screen items-center justify-center">
        {/* Basic full page loading skeleton */}
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Render nothing while redirecting or if auth fails after initial load
    // The useEffect hook handles the redirect
    return null; 
  }

  // User is authenticated, render the actual dashboard layout and page content
  return (
    <ProtectedRoute>
      <GlobalFilterProvider> {/* Wrap with the provider */}
        <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto bg-[hsl(var(--dashboard-bg))] p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
              <div className="container mx-auto max-w-[1600px] h-full w-full px-2 sm:px-4">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </div>
      </GlobalFilterProvider>
    </ProtectedRoute>
  )
}
