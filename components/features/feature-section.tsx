"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Section } from "@/components/layout/section"
import { SectionHeader } from "@/components/layout/section-header"
import { FeatureCard } from "@/components/features/feature-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface Feature {
  title: string
  description: string
  icon: ReactNode
  href?: string
}

interface FeatureSectionProps {
  title: string
  description?: string
  features: Feature[]
  className?: string
  variant?: "default" | "primary" | "secondary" | "dark"
  columns?: 2 | 3 | 4
  withAnimation?: boolean
  withCta?: boolean
  ctaText?: string
  ctaHref?: string
  ctaSecondaryText?: string
  ctaSecondaryHref?: string
  highlightWord?: string
}

export function FeatureSection({
  title,
  description,
  features,
  className,
  variant = "default",
  columns = 4,
  withAnimation = true,
  withCta = false,
  ctaText = "View All Solutions",
  ctaHref = "/solutions",
  ctaSecondaryText,
  ctaSecondaryHref,
  highlightWord,
}: FeatureSectionProps) {
  const gridClasses: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <Section 
      variant={variant} 
      className={className}
      withGrid={false}
    >
      <SectionHeader
        title={title}
        description={description}
        highlightWord={highlightWord}
        withAnimation={withAnimation}
      />

      <div className={cn(
        "grid grid-cols-1 gap-8",
        gridClasses[columns]
      )}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            href={feature.href}
            withAnimation={withAnimation}
            animationDelay={index * 100}
          />
        ))}
      </div>

      {withCta && (
        <div className="mt-16 text-center">
          <Button 
            size="lg" 
            className="bg-purple text-white hover:bg-opacity-90" 
            asChild
          >
            <Link href={ctaHref}>
              {ctaText} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          {ctaSecondaryText && ctaSecondaryHref && (
            <Button
              size="lg"
              variant="outline"
              className="border-purple text-purple dark:text-white hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10 ml-4"
              asChild
            >
              <Link href={ctaSecondaryHref}>
                {ctaSecondaryText}
              </Link>
            </Button>
          )}
        </div>
      )}
    </Section>
  )
} 