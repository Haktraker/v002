"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  type: "hero" | "feature" | "card" | "section" | "stats"
  count?: number
  className?: string
}

export function LoadingSkeleton({ type, count = 1, className }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case "hero":
        return (
          <div className={cn("w-full space-y-8", className)}>
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <Skeleton className="h-12 w-3/4 max-w-2xl rounded-lg" />
              <Skeleton className="h-6 w-2/3 max-w-xl rounded-lg" />
              <div className="flex space-x-4 pt-4">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          </div>
        )
      
      case "feature":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            ))}
          </div>
        )
      
      case "card":
        return (
          <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-6 space-y-4 border rounded-lg">
                <Skeleton className="h-6 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
            ))}
          </div>
        )
      
      case "section":
        return (
          <div className={cn("space-y-8", className)}>
            <div className="space-y-4 max-w-2xl mx-auto text-center">
              <Skeleton className="h-8 w-1/2 mx-auto rounded-lg" />
              <Skeleton className="h-4 w-3/4 mx-auto rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          </div>
        )
      
      case "stats":
        return (
          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex p-4 space-x-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2 rounded-md" />
                  <Skeleton className="h-8 w-1/3 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  return renderSkeleton()
} 