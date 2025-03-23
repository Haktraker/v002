"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Section } from "@/components/layout/section"
import { SectionHeader } from "@/components/layout/section-header"

interface ProcessStep {
  title: string
  description: string
  icon: ReactNode
  number: number
}

interface ProcessSectionProps {
  title: string
  description?: string
  steps: ProcessStep[]
  className?: string
  variant?: "default" | "primary" | "secondary" | "dark"
  withAnimation?: boolean
  highlightWord?: string
  columns?: 2 | 3 | 4
}

export function ProcessSection({
  title,
  description,
  steps,
  className,
  variant = "primary",
  withAnimation = true,
  highlightWord,
  columns = 4,
}: ProcessSectionProps) {
  const gridClasses: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <Section 
      variant={variant} 
      className={cn("relative overflow-hidden", className)}
      withGrid={false}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-20"></div>

      <div className="relative z-10">
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
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-dark-card p-6 rounded-lg relative"
              data-aos={withAnimation ? "fade-up" : undefined}
              data-aos-delay={index * 100}
            >
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-purple text-white flex items-center justify-center font-bold">
                {step.number}
              </div>
              <div className="h-12 w-12 mb-4 text-purple">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-foreground/80 dark:text-white-85">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
} 