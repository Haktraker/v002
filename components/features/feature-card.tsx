"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  className?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  href?: string
  withAnimation?: boolean
  animationDelay?: number
  variant?: "default" | "outline" | "filled"
  withHoverEffect?: boolean
}

export function FeatureCard({ 
  title, 
  description, 
  icon, 
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
  href,
  withAnimation = true,
  animationDelay = 0,
  variant = "default",
  withHoverEffect = true,
}: FeatureCardProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-white dark:bg-dark-card",
    outline: "bg-transparent border border-border dark:border-white/10",
    filled: "bg-purple-bg-5 dark:bg-purple-bg-10"
  }

  const cardContent = (
    <>
      <div 
        className={cn(
          "mb-4 bg-purple-bg-5 dark:bg-purple-bg-10 p-4 rounded-md inline-block", 
          withHoverEffect && "group-hover:bg-purple-bg-10 dark:group-hover:bg-purple-bg-20",
          "transition-colors duration-300",
          iconClassName
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 
        className={cn(
          "text-xl font-bold mb-2", 
          withHoverEffect && "group-hover:text-purple", 
          "transition-colors duration-300",
          titleClassName
        )}
      >
        {title}
      </h3>
      <p 
        className={cn(
          "text-foreground/80 dark:text-white-85",
          descriptionClassName
        )}
      >
        {description}
      </p>
    </>
  )

  const baseClasses = cn(
    variantStyles[variant],
    "p-6 rounded-lg transition-all duration-300",
    withHoverEffect && "group hover:shadow-md dark:hover:shadow-purple/5",
    className
  )

  if (href) {
    return (
      <Link 
        href={href}
        className={baseClasses}
        data-aos={withAnimation ? "fade-up" : undefined}
        data-aos-delay={animationDelay}
        tabIndex={0}
        aria-label={`Feature: ${title}`}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div 
      className={baseClasses}
      data-aos={withAnimation ? "fade-up" : undefined}
      data-aos-delay={animationDelay}
    >
      {cardContent}
    </div>
  )
}

