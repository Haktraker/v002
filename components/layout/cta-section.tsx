"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/section"

interface CtaSectionProps {
  title: string | ReactNode
  description?: string | ReactNode
  primaryButtonText: string
  primaryButtonHref: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
  className?: string
  withAnimation?: boolean
  variant?: "default" | "primary" | "secondary" | "dark"
  withCard?: boolean
  cardClassName?: string
  layout?: "row" | "column"
  icon?: ReactNode
}

export function CtaSection({
  title,
  description,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  className,
  withAnimation = true,
  variant = "default",
  withCard = true,
  cardClassName,
  layout = "row",
  icon,
}: CtaSectionProps) {
  const content = (
    <div 
      className={cn(
        "flex flex-col",
        layout === "row" ? "md:flex-row items-center justify-between" : "items-center text-center",
        withCard && "bg-[#F7F7F7] dark:bg-dark-card p-8 md:p-12 rounded-lg"
      )}
      data-aos={withAnimation ? "fade-up" : undefined}
    >
      <div className={cn(
        layout === "row" ? "mb-6 md:mb-0 md:mr-8" : "mb-8 w-full text-center",
        "flex items-center"
      )}>
        {icon && (
          <div className="mr-4 text-purple dark:text-purple-secondary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-foreground/80 dark:text-white-85 max-w-xl">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className={cn(
        "flex",
        layout === "column" ? "flex-col md:flex-row" : "flex-col sm:flex-row",
        "gap-4"
      )}>
        <Button size="lg" className="bg-purple text-white hover:bg-opacity-90" asChild>
          <Link href={primaryButtonHref}>{primaryButtonText}</Link>
        </Button>
        {secondaryButtonText && secondaryButtonHref && (
          <Button
            size="lg"
            variant="outline"
            className="border-purple text-purple dark:text-white hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10"
            asChild
          >
            <Link href={secondaryButtonHref}>{secondaryButtonText}</Link>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Section
      variant={variant}
      className={className}
      withContainer={true}
      containerClassName={withCard ? cardClassName : undefined}
    >
      {withCard ? content : <div className={cardClassName}>{content}</div>}
    </Section>
  )
} 