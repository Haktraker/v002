"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SectionVariant = "default" | "primary" | "secondary" | "dark"

interface SectionProps {
  children: ReactNode
  className?: string
  id?: string
  variant?: SectionVariant
  withContainer?: boolean
  containerClassName?: string
  withGrid?: boolean
  gridClassName?: string
  withPadding?: boolean
  withOverflow?: boolean
}

export function Section({
  children,
  className,
  id,
  variant = "default",
  withContainer = true,
  containerClassName,
  withGrid = false,
  gridClassName,
  withPadding = true,
  withOverflow = false,
}: SectionProps) {
  const variantStyles: Record<SectionVariant, string> = {
    default: "bg-[#F7F7F7] dark:bg-dark-bg",
    primary: "bg-purple-bg-5 dark:bg-dark-purple",
    secondary: "bg-purple/5 dark:bg-dark-card",
    dark: "bg-dark-bg dark:bg-black",
  }

  const content = withGrid ? (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", gridClassName)}>
      {children}
    </div>
  ) : (
    children
  )

  return (
    <section
      id={id}
      className={cn(
        variantStyles[variant],
        withPadding && "py-16 md:py-24",
        !withOverflow && "overflow-hidden",
        className
      )}
    >
      {withContainer ? (
        <div className={cn("container mx-auto px-4", containerClassName)}>{content}</div>
      ) : (
        content
      )}
    </section>
  )
} 