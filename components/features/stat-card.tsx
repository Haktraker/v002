"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: ReactNode
  className?: string
  iconClassName?: string
  titleClassName?: string
  valueClassName?: string
  descriptionClassName?: string
  withAnimation?: boolean
  animationDelay?: number
  direction?: "row" | "column"
  variant?: "default" | "outline" | "filled"
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  className,
  iconClassName,
  titleClassName,
  valueClassName,
  descriptionClassName,
  withAnimation = true,
  animationDelay = 0,
  direction = "row",
  variant = "default"
}: StatCardProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-white/80 dark:bg-dark-card-translucent backdrop-blur-md",
    outline: "bg-white/50 dark:bg-dark-card/50 backdrop-blur-md border border-border dark:border-white/10",
    filled: "bg-purple-bg-5 dark:bg-purple-bg-10"
  }

  return (
    <div 
      className={cn(
        variantStyles[variant],
        "p-6 rounded-lg transition-all duration-300 hover:shadow-md dark:hover:shadow-purple/5",
        className
      )}
      data-aos={withAnimation ? "fade-up" : undefined}
      data-aos-delay={animationDelay}
    >
      <div className={cn(
        "flex",
        direction === "row" ? "items-start" : "flex-col items-center text-center"
      )}>
        <div className={cn(
          direction === "row" ? "mr-4" : "mb-4",
          "bg-purple-bg-5 dark:bg-purple-bg-10 p-2 rounded-md transition-colors",
          iconClassName
        )}
        aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h3 className={cn(
            "text-lg font-medium text-gray-700 dark:text-white-85",
            titleClassName
          )}>
            {title}
          </h3>
          <p className={cn(
            "text-2xl font-bold text-purple",
            valueClassName
          )}>
            {value}
          </p>
          <p className={cn(
            "text-sm text-gray-500 dark:text-white-45 mt-1",
            descriptionClassName
          )}>
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

